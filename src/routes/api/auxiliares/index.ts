import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";
import isDirectivoAuthenticated from "../../../middlewares/isDirectivoAuthenticated";
import checkAuthentication from "../../../middlewares/checkAuthentication";
import { DirectivoAuthenticated } from "../../../interfaces/shared/JWTPayload";
import {
  PermissionErrorTypes,
  RequestErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
  ValidationErrorTypes,
} from "../../../interfaces/shared/apis/errors";
import { handlePrismaError } from "../../../lib/helpers/handlers/errors/prisma";
import { validateDNI } from "../../../lib/helpers/validators/data/validateDNI";
import { ValidatorConfig } from "../../../lib/helpers/validators/data/types";
import { validateNames } from "../../../lib/helpers/validators/data/validateNombres";
import { validateLastNames } from "../../../lib/helpers/validators/data/validateApellidos";
import { validateGender } from "../../../lib/helpers/validators/data/validateGenero";
import { validatePhone } from "../../../lib/helpers/validators/data/validateCelular";
import { validateEmail } from "../../../lib/helpers/validators/data/validateCorreo";
import { validateData } from "../../../lib/helpers/validators/data/validateData";
import {
  GetAuxiliaresSuccessResponse,
  GetAuxiliarSuccessResponse,
  SwitchEstadoAuxiliarSuccessResponse,
  UpdateAuxiliarRequestBody,
  UpdateAuxiliarSuccessResponse,
} from "../../../interfaces/shared/apis/api01/auxiliares/types";

const router = Router();
const prisma = new PrismaClient();

// Obtener todos los auxiliares
router.get(
  "/",

  (async (req: Request, res: Response) => {
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

      const auxiliares = await prisma.t_Auxiliares.findMany({
        select: {
          DNI_Auxiliar: true,
          Nombres: true,
          Apellidos: true,
          Genero: true,
          Nombre_Usuario: true,
          Estado: true,
          Correo_Electronico: true,
          Celular: true,
          Google_Drive_Foto_ID: true,
        },
        orderBy: {
          Apellidos: "asc",
        },
      });

      return res.status(200).json({
        success: true,
        message: "Auxiliares obtenidos exitosamente",
        data: auxiliares,
      } as GetAuxiliaresSuccessResponse);
    } catch (error) {
      console.error("Error al obtener auxiliares:", error);

      const handledError = handlePrismaError(error);
      if (handledError) {
        return res.status(handledError.status).json(handledError.response);
      }

      return res.status(500).json({
        success: false,
        message: "Error al obtener auxiliares",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: error,
      } as ErrorResponseAPIBase);
    }
  }) as any
);

// Obtener un auxiliar por DNI
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

    // Obtener auxiliar
    const auxiliar = await prisma.t_Auxiliares.findUnique({
      where: {
        DNI_Auxiliar: dni,
      },
      select: {
        DNI_Auxiliar: true,
        Nombres: true,
        Apellidos: true,
        Genero: true,
        Nombre_Usuario: true,
        Estado: true,
        Correo_Electronico: true,
        Celular: true,
        Google_Drive_Foto_ID: true,
      },
    });

    if (!auxiliar) {
      return res.status(404).json({
        success: false,
        message: "Auxiliar no encontrado",
        errorType: UserErrorTypes.USER_NOT_FOUND,
      } as ErrorResponseAPIBase);
    }

    return res.status(200).json({
      success: true,
      message: "Auxiliar obtenido exitosamente",
      data: auxiliar,
    } as GetAuxiliarSuccessResponse);
  } catch (error) {
    console.error("Error al obtener auxiliar:", error);

    const handledError = handlePrismaError(error);
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    return res.status(500).json({
      success: false,
      message: "Error al obtener auxiliar",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

// Actualizar un auxiliar
router.put("/:dni", (async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    const { Nombres, Apellidos, Genero, Celular, Correo_Electronico } =
      req.body as UpdateAuxiliarRequestBody;

    // Validar el formato del DNI
    const dniValidation = validateDNI(dni, true);
    if (!dniValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: dniValidation.errorMessage,
        errorType: ValidationErrorTypes.INVALID_DNI,
      } as ErrorResponseAPIBase);
    }

    // Verificar si el auxiliar existe
    const existingAuxiliar = await prisma.t_Auxiliares.findUnique({
      where: {
        DNI_Auxiliar: dni,
      },
    });

    if (!existingAuxiliar) {
      return res.status(404).json({
        success: false,
        message: "Auxiliar no encontrado",
        errorType: UserErrorTypes.USER_NOT_FOUND,
      } as ErrorResponseAPIBase);
    }

    // Configurar validadores para los campos a actualizar
    const validators: ValidatorConfig[] = [];

    if (Nombres !== undefined) {
      validators.push({ field: "Nombres", validator: validateNames });
    }

    if (Apellidos !== undefined) {
      validators.push({ field: "Apellidos", validator: validateLastNames });
    }

    if (Genero !== undefined) {
      validators.push({ field: "Genero", validator: validateGender });
    }

    if (Celular !== undefined) {
      validators.push({ field: "Celular", validator: validatePhone });
    }

    if (Correo_Electronico !== undefined && Correo_Electronico !== null) {
      validators.push({
        field: "Correo_Electronico",
        validator: validateEmail,
      });
    }

    // Validar datos si hay campos a actualizar
    if (validators.length > 0) {
      const validationResult = validateData(
        { Nombres, Apellidos, Genero, Celular, Correo_Electronico },
        validators
      );

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: validationResult.errorMessage,
          errorType: validationResult.errorType,
        } as ErrorResponseAPIBase);
      }
    }

    // Preparar datos para actualización
    const updateData: any = {};

    if (Nombres !== undefined) updateData.Nombres = Nombres;
    if (Apellidos !== undefined) updateData.Apellidos = Apellidos;
    if (Genero !== undefined) updateData.Genero = Genero;
    if (Celular !== undefined) updateData.Celular = Celular;
    if (Correo_Electronico !== undefined)
      updateData.Correo_Electronico = Correo_Electronico;

    // Si no hay datos para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron datos para actualizar",
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      } as ErrorResponseAPIBase);
    }

    // Actualizar auxiliar
    const updatedAuxiliar = await prisma.t_Auxiliares.update({
      where: {
        DNI_Auxiliar: dni,
      },
      data: updateData,
      select: {
        DNI_Auxiliar: true,
        Nombres: true,
        Apellidos: true,
        Genero: true,
        Estado: true,
        Celular: true,
        Correo_Electronico: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Auxiliar actualizado exitosamente",
      data: updatedAuxiliar,
    } as UpdateAuxiliarSuccessResponse);
  } catch (error) {
    console.error("Error al actualizar auxiliar:", error);

    const handledError = handlePrismaError(error);
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    return res.status(500).json({
      success: false,
      message: "Error al actualizar auxiliar",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

// Cambiar estado de un auxiliar (activar/desactivar)
router.patch(
  "/:dni/estado",
  isDirectivoAuthenticated,
  checkAuthentication as any,
  (async (req: Request, res: Response) => {
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

      // Verificar si el auxiliar existe y obtener su estado actual
      const existingAuxiliar = await prisma.t_Auxiliares.findUnique({
        where: {
          DNI_Auxiliar: dni,
        },
        select: {
          DNI_Auxiliar: true,
          Estado: true,
        },
      });

      if (!existingAuxiliar) {
        return res.status(404).json({
          success: false,
          message: "Auxiliar no encontrado",
          errorType: UserErrorTypes.USER_NOT_FOUND,
        } as ErrorResponseAPIBase);
      }

      // Cambiar el estado (invertir el valor actual)
      const updatedAuxiliar = await prisma.t_Auxiliares.update({
        where: {
          DNI_Auxiliar: dni,
        },
        data: {
          Estado: !existingAuxiliar.Estado,
        },
        select: {
          DNI_Auxiliar: true,
          Nombres: true,
          Apellidos: true,
          Estado: true,
        },
      });

      const statusMessage = updatedAuxiliar.Estado ? "activado" : "desactivado";

      return res.status(200).json({
        success: true,
        message: `Auxiliar ${statusMessage} exitosamente`,
        data: updatedAuxiliar,
      } as SwitchEstadoAuxiliarSuccessResponse);
    } catch (error) {
      console.error("Error al cambiar estado del auxiliar:", error);

      const handledError = handlePrismaError(error);
      if (handledError) {
        return res.status(handledError.status).json(handledError.response);
      }

      return res.status(500).json({
        success: false,
        message: "Error al cambiar estado del auxiliar",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: error,
      } as ErrorResponseAPIBase);
    }
  }) as any
);

export default router;
