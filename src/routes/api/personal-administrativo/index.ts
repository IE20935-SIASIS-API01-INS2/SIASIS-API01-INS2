import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";
import { DirectivoAuthenticated } from "../../../interfaces/shared/JWTPayload";
import {
  PermissionErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
  ValidationErrorTypes,
} from "../../../interfaces/shared/apis/errors";
import { handlePrismaError } from "../../../lib/helpers/handlers/errors/prisma";
import { validateDNI } from "../../../lib/helpers/validators/data/validateDNI";
import {
  GetPersonalAdministrativoSuccessResponse,
  GetPersonalAdministrativoUnicoSuccessResponse,
  SwitchEstadoPersonalAdministrativoSuccessResponse,
} from "../../../interfaces/shared/apis/api01/personal-administrativo/types";

const router = Router();
const prisma = new PrismaClient();

// Obtener todo el personal administrativo
router.get("/", (async (req: Request, res: Response) => {
  try {
    // Verificar que el usuario autenticado es un directivo
    const directivo = req.user as DirectivoAuthenticated;
    if (!directivo.Id_Directivo) {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para acceder a esta información",
        errorType: PermissionErrorTypes.INSUFFICIENT_PERMISSIONS,
      } as ErrorResponseAPIBase);
    }

    const personalAdministrativo =
      await prisma.t_Personal_Administrativo.findMany({
        select: {
          DNI_Personal_Administrativo: true,
          Nombres: true,
          Apellidos: true,
          Genero: true,
          Nombre_Usuario: true,
          Estado: true,
          Celular: true,
          Google_Drive_Foto_ID: true,
          Horario_Laboral_Entrada: true,
          Horario_Laboral_Salida: true,
          Cargo: true,
        },
        orderBy: {
          Apellidos: "asc",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Personal administrativo obtenido exitosamente",
      data: personalAdministrativo,
    } as GetPersonalAdministrativoSuccessResponse);
  } catch (error) {
    console.error("Error al obtener personal administrativo:", error);

    const handledError = handlePrismaError(error);
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    return res.status(500).json({
      success: false,
      message: "Error al obtener personal administrativo",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

// Obtener un miembro del personal administrativo por DNI
router.get("/:dni", (async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;

    // Validar el formato del DNI
    const dniValidation = validateDNI(dni, true);
    if (!dniValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: dniValidation.errorMessage,
        errorType: ValidationErrorTypes.INVALID_DNI,
      } as ErrorResponseAPIBase);
    }

    // Obtener personal administrativo
    const personalAdministrativo =
      await prisma.t_Personal_Administrativo.findUnique({
        where: {
          DNI_Personal_Administrativo: dni,
        },
        select: {
          DNI_Personal_Administrativo: true,
          Nombres: true,
          Apellidos: true,
          Genero: true,
          Nombre_Usuario: true,
          Estado: true,
          Celular: true,
          Google_Drive_Foto_ID: true,
          Horario_Laboral_Entrada: true,
          Horario_Laboral_Salida: true,
          Cargo: true,
        },
      });

    if (!personalAdministrativo) {
      return res.status(404).json({
        success: false,
        message: "Personal administrativo no encontrado",
        errorType: UserErrorTypes.USER_NOT_FOUND,
      } as ErrorResponseAPIBase);
    }

    return res.status(200).json({
      success: true,
      message: "Personal administrativo obtenido exitosamente",
      data: personalAdministrativo,
    } as GetPersonalAdministrativoUnicoSuccessResponse);
  } catch (error) {
    console.error("Error al obtener personal administrativo:", error);

    const handledError = handlePrismaError(error);
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    return res.status(500).json({
      success: false,
      message: "Error al obtener personal administrativo",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

// Cambiar estado de un miembro del personal administrativo (activar/desactivar)
router.patch("/:dni/estado", (async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;

    // Validar el formato del DNI
    const dniValidation = validateDNI(dni, true);
    if (!dniValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: dniValidation.errorMessage,
        errorType: ValidationErrorTypes.INVALID_DNI,
      } as ErrorResponseAPIBase);
    }

    // Verificar si el personal administrativo existe y obtener su estado actual
    const existingPersonal = await prisma.t_Personal_Administrativo.findUnique({
      where: {
        DNI_Personal_Administrativo: dni,
      },
      select: {
        DNI_Personal_Administrativo: true,
        Estado: true,
      },
    });

    if (!existingPersonal) {
      return res.status(404).json({
        success: false,
        message: "Personal administrativo no encontrado",
        errorType: UserErrorTypes.USER_NOT_FOUND,
      } as ErrorResponseAPIBase);
    }

    // Cambiar el estado (invertir el valor actual)
    const updatedPersonal = await prisma.t_Personal_Administrativo.update({
      where: {
        DNI_Personal_Administrativo: dni,
      },
      data: {
        Estado: !existingPersonal.Estado,
      },
      select: {
        DNI_Personal_Administrativo: true,
        Nombres: true,
        Apellidos: true,
        Estado: true,
      },
    });

    const statusMessage = updatedPersonal.Estado ? "activado" : "desactivado";

    return res.status(200).json({
      success: true,
      message: `Personal administrativo ${statusMessage} exitosamente`,
      data: updatedPersonal,
    } as SwitchEstadoPersonalAdministrativoSuccessResponse);
  } catch (error) {
    console.error(
      "Error al cambiar estado del personal administrativo:",
      error
    );

    const handledError = handlePrismaError(error);
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    return res.status(500).json({
      success: false,
      message: "Error al cambiar estado del personal administrativo",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

export default router;
