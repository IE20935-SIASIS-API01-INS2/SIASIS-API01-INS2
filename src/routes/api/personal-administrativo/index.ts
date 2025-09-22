import { Request, Response, Router } from "express";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";
import { DirectivoAuthenticated } from "../../../interfaces/shared/JWTPayload";
import {
  PermissionErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
  ValidationErrorTypes,
} from "../../../interfaces/shared/errors";
import { validateIdentificadorDeUsuario } from "../../../lib/helpers/validators/data/validateIdentificadorDeUsuario";
import {
  GetPersonalAdministrativoSuccessResponse,
  GetPersonalAdministrativoUnicoSuccessResponse,
  SwitchEstadoPersonalAdministrativoSuccessResponse,
} from "../../../interfaces/shared/apis/api01/personal-administrativo/types";

// Importar funciones de consulta

import { buscarPersonalAdministrativoPorIdSelect } from "../../../../core/databases/queries/RDP02/personal-administrativo/buscarPersonalAdministrativoPorId";
import { cambiarEstadoPersonalAdministrativo } from "../../../../core/databases/queries/RDP02/personal-administrativo/cambiarEstadoPersonalAdministrativo";
import { buscarTodosLosPersonalesAdministrativo } from "../../../../core/databases/queries/RDP02/personal-administrativo/buscarTodosLosPersonalesAdministrativos";
import { handleSQLError } from "../../../lib/helpers/handlers/errors/postgreSQL";

const router = Router();

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

    const rdp02EnUso = req.RDP02_INSTANCE!;
    const personalAdministrativo = await buscarTodosLosPersonalesAdministrativo(
      rdp02EnUso
    );

    return res.status(200).json({
      success: true,
      message: "Personal administrativo obtenido exitosamente",
      data: personalAdministrativo,
    } as GetPersonalAdministrativoSuccessResponse);
  } catch (error) {
    console.error("Error al obtener personal administrativo:", error);

    const handledError = handleSQLError(error);
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

// Obtener un miembro del personal administrativo por Id
router.get("/:idUsuario", (async (req: Request, res: Response) => {
  try {
    const { idUsuario } = req.params;
    const rdp02EnUso = req.RDP02_INSTANCE!;

    // Validar el formato del identificador
    const identificadorValidation = validateIdentificadorDeUsuario(idUsuario, true);
    if (!identificadorValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: identificadorValidation.errorMessage,
        errorType: ValidationErrorTypes.INVALID_USER_IDENTIFIER,
      } as ErrorResponseAPIBase);
    }

    // Obtener personal administrativo
    const personalAdministrativo =
      await buscarPersonalAdministrativoPorIdSelect(
        idUsuario,
        [
          "Id_Personal_Administrativo",
          "Nombres",
          "Apellidos",
          "Nombre_Usuario",
          "Genero",
          "Estado",
          "Cargo",
          "Celular",
          "Google_Drive_Foto_ID",
        ],
        rdp02EnUso
      );

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

    const handledError = handleSQLError(error);
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
router.patch("/:idUsuario/estado", (async (req: Request, res: Response) => {
  try {
    const { idUsuario } = req.params;
    const rdp02EnUso = req.RDP02_INSTANCE!;

    // Validar el formato del identificador
    const identificadorValidation = validateIdentificadorDeUsuario(idUsuario, true);
    if (!identificadorValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: identificadorValidation.errorMessage,
        errorType: ValidationErrorTypes.INVALID_USER_IDENTIFIER,
      } as ErrorResponseAPIBase);
    }

    // Cambiar el estado del personal administrativo
    const updatedPersonal = await cambiarEstadoPersonalAdministrativo(
      idUsuario,
      undefined,
      rdp02EnUso
    );

    if (!updatedPersonal) {
      return res.status(404).json({
        success: false,
        message: "Personal administrativo no encontrado",
        errorType: UserErrorTypes.USER_NOT_FOUND,
      } as ErrorResponseAPIBase);
    }

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

    const handledError = handleSQLError(error);
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
