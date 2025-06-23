import { Request, Response, Router } from "express";
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
} from "../../../interfaces/shared/errors";
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

// Importar funciones de consulta
import { buscarAuxiliarPorDNISelect } from "../../../../core/databases/queries/RDP02/auxiliares/buscarAuxiliarPorDNI";
import { verificarExistenciaAuxiliar } from "../../../../core/databases/queries/RDP02/auxiliares/verificarExistenciaAuxiliar";
import { buscarTodosLosAuxiliares } from "../../../../core/databases/queries/RDP02/auxiliares/buscarTodosLosAuxiliares";
import { handleSQLError } from "../../../lib/helpers/handlers/errors/postgreSQL";
import { actualizarDatosDeAuxiliar } from "../../../../core/databases/queries/RDP02/auxiliares/actualizarDatosDeAuxiliar";
import { cambiarEstadoAuxiliar } from "../../../../core/databases/queries/RDP02/auxiliares/cambiarEstadoAuxiliar";

const router = Router();

// Obtener todos los auxiliares
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
    const auxiliares = await buscarTodosLosAuxiliares(rdp02EnUso);

    return res.status(200).json({
      success: true,
      message: "Auxiliares obtenidos exitosamente",
      data: auxiliares,
    } as GetAuxiliaresSuccessResponse);
  } catch (error) {
    console.error("Error al obtener auxiliares:", error);

    const handledError = handleSQLError(error);
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
}) as any);

// Obtener un auxiliar por DNI
router.get("/:dni", (async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    const rdp02EnUso = req.RDP02_INSTANCE!;

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
    const auxiliar = await buscarAuxiliarPorDNISelect(
      dni,
      [
        "DNI_Auxiliar",
        "Nombres",
        "Apellidos",
        "Celular",
        "Estado",
        "Genero",
        "Nombre_Usuario",
        "Correo_Electronico",
        "Google_Drive_Foto_ID",
      ],
      rdp02EnUso
    );

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

    const handledError = handleSQLError(error);
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
    const rdp02EnUso = req.RDP02_INSTANCE!;
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
    const existingAuxiliar = await verificarExistenciaAuxiliar(dni, rdp02EnUso);

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
    const updatedAuxiliar = await actualizarDatosDeAuxiliar(
      dni,
      updateData,
      rdp02EnUso
    );

    if (!updatedAuxiliar) {
      return res.status(500).json({
        success: false,
        message: "Error al actualizar auxiliar",
        errorType: SystemErrorTypes.DATABASE_ERROR,
      } as ErrorResponseAPIBase);
    }

    return res.status(200).json({
      success: true,
      message: "Auxiliar actualizado exitosamente",
      data: updatedAuxiliar,
    } as UpdateAuxiliarSuccessResponse);
  } catch (error) {
    console.error("Error al actualizar auxiliar:", error);

    const handledError = handleSQLError(error);
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
      const rdp02EnUso = req.RDP02_INSTANCE!;

      // Validar el formato del DNI
      const dniValidation = validateDNI(dni, true);
      if (!dniValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: dniValidation.errorMessage,
          errorType: ValidationErrorTypes.INVALID_DNI,
        } as ErrorResponseAPIBase);
      }

      // Cambiar el estado del auxiliar
      const updatedAuxiliar = await cambiarEstadoAuxiliar(
        dni,
        undefined,
        rdp02EnUso
      );

      if (!updatedAuxiliar) {
        return res.status(404).json({
          success: false,
          message: "Auxiliar no encontrado",
          errorType: UserErrorTypes.USER_NOT_FOUND,
        } as ErrorResponseAPIBase);
      }

      const statusMessage = updatedAuxiliar.Estado ? "activado" : "desactivado";

      return res.status(200).json({
        success: true,
        message: `Auxiliar ${statusMessage} exitosamente`,
        data: updatedAuxiliar,
      } as SwitchEstadoAuxiliarSuccessResponse);
    } catch (error) {
      console.error("Error al cambiar estado del auxiliar:", error);

      const handledError = handleSQLError(error);
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
