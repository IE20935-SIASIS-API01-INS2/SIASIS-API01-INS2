import { Request, Response, Router } from "express";
import {
  ErrorResponseAPIBase,
  SuccessResponseAPIBase,
} from "../../../../interfaces/shared/apis/types";
import isDirectivoAuthenticated from "../../../../middlewares/isDirectivoAuthenticated";
import isTutorAuthenticated from "../../../../middlewares/isTutorAuthenticated";
import checkAuthentication from "../../../../middlewares/checkAuthentication";
import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import {
  RequestErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
  ValidationErrorTypes,
} from "../../../../interfaces/shared/apis/errors";
import {
  DirectivoAuthenticated,
  ProfesorTutorSecundariaAuthenticated,
} from "../../../../interfaces/shared/JWTPayload";
import { ValidatorConfig } from "../../../../lib/helpers/validators/data/types";
import { validateData } from "../../../../lib/helpers/validators/data/validateData";
import { validateEmail } from "../../../../lib/helpers/validators/data/validateCorreo";
import { enviarCorreoOTP } from "../../../../lib/helpers/email/enviarCorreoOTP";
import generarCodigoOTP from "../../../../lib/helpers/security/generarCodigoOTP";
import {
  CambiarCorreoRequestBody,
  CambiarCorreoSuccessResponse,
  ConfirmarCorreoRequestBody,
} from "../../../../interfaces/shared/apis/api01/mis-datos/cambiar-correo/types";
import { OTP_CODE_FOR_UPDATING_EMAIL_MINUTES } from "../../../../constants/expirations";

import { verificarCorreoExistente } from "../../../../../core/databases/queries/RDP02/shared/emails/verificarCorreoExistente";
import { buscarDirectivoPorIdSelect } from "../../../../../core/databases/queries/RDP02/directivos/buscarDirectivoPorId";
import { buscarProfesorSecundariaPorDNISelect } from "../../../../../core/databases/queries/RDP02/profesor-secundaria/buscarProfesorSecundariaPorDNI";
import { crearCodigoOTP } from "../../../../../core/databases/queries/RDP02/codigos-OTP/crearCodigoOTP";
import { buscarCodigoOTP } from "../../../../../core/databases/queries/RDP02/codigos-OTP/buscarCodigoOTP";
import { actualizarCorreoDirectivo } from "../../../../../core/databases/queries/RDP02/directivos/actualizarCorreoElectronicoDirectivo";
import { actualizarCorreoProfesorTutorSecundaria } from "../../../../../core/databases/queries/RDP02/profesor-secundaria/actualizarCorreoProfesorTutorSecundaria";
import { eliminarCodigoOTP } from "../../../../../core/databases/queries/RDP02/codigos-OTP/eliminarCodigoOTP";
import { handleSQLError } from "../../../../lib/helpers/handlers/errors/postgreSQL";

const router = Router();

router.put(
  "/solicitar-cambio-correo",
  isDirectivoAuthenticated,
  isTutorAuthenticated,
  checkAuthentication as any,
  (async (req: Request, res: Response) => {
    try {
      const userData = req.user!;
      const userRole = req.userRole!;
      const rdp02EnUso = req.RDP02_INSTANCE!;
      const { nuevoCorreo } = req.body as CambiarCorreoRequestBody;

      // Verificar que el rol es uno de los permitidos
      if (
        userRole !== RolesSistema.Directivo &&
        userRole !== RolesSistema.Tutor
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Este endpoint solo está disponible para Directivos y Tutores",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Configurar validadores
      const validators: ValidatorConfig[] = [
        { field: "nuevoCorreo", validator: validateEmail },
      ];

      // Validar el correo electrónico
      const validationResult = validateData({ nuevoCorreo }, validators);

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: validationResult.errorMessage,
          errorType: validationResult.errorType,
        } as ErrorResponseAPIBase);
      }

      // Verificar si el correo ya existe en cualquiera de las tablas donde es único
      const correoExistente = await verificarCorreoExistente(nuevoCorreo);

      if (correoExistente) {
        return res.status(409).json({
          success: false,
          message: "El correo electrónico ya está registrado en el sistema",
          errorType: ValidationErrorTypes.INVALID_EMAIL,
        } as ErrorResponseAPIBase);
      }

      // Obtener información del usuario según su rol
      let nombreCompleto = "";

      if (userRole === RolesSistema.Directivo) {
        const directivo = await buscarDirectivoPorIdSelect(
          (userData as DirectivoAuthenticated).Id_Directivo,
          ["Nombres", "Apellidos"]
        );

        if (!directivo) {
          return res.status(404).json({
            success: false,
            message: "Directivo no encontrado",
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        nombreCompleto = `${directivo.Nombres} ${directivo.Apellidos}`;
      } else {
        // Rol es Tutor
        const tutor = await buscarProfesorSecundariaPorDNISelect(
          (userData as ProfesorTutorSecundariaAuthenticated)
            .DNI_Profesor_Secundaria,
          ["Nombres", "Apellidos"]
        );

        if (!tutor) {
          return res.status(404).json({
            success: false,
            message: "Tutor no encontrado",
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        nombreCompleto = `${tutor.Nombres} ${tutor.Apellidos}`;
      }

      // Generar código OTP
      const codigoOTP = generarCodigoOTP();

      // Timestamp actual en milisegundos
      const ahora = Date.now();

      // Calcular tiempo de expiración (minutos desde ahora en milisegundos)
      const fechaExpiracion =
        ahora + OTP_CODE_FOR_UPDATING_EMAIL_MINUTES * 60 * 1000;

      // Guardar código OTP en la base de datos usando timestamps Unix
      await crearCodigoOTP(
        {
          Codigo: codigoOTP,
          Fecha_Creacion: ahora,
          Correo_Destino: nuevoCorreo,
          Rol_Usuario: userRole,
          Id_Usuario:
            userRole === RolesSistema.Directivo
              ? String((userData as DirectivoAuthenticated).Id_Directivo)
              : (userData as ProfesorTutorSecundariaAuthenticated)
                  .DNI_Profesor_Secundaria,
          Fecha_Expiracion: fechaExpiracion,
        },
        rdp02EnUso
      );

      // Enviar correo electrónico con el código OTP
      await enviarCorreoOTP(nuevoCorreo, codigoOTP, nombreCompleto);

      // Calcular tiempo de expiración en segundos (desde timestamp en ms)
      const tiempoExpiracionSegundos = Math.floor(
        (fechaExpiracion - ahora) / 1000
      );

      return res.status(200).json({
        success: true,
        message:
          "Se ha enviado un código de verificación al nuevo correo electrónico.",
        otpExpireTime: tiempoExpiracionSegundos,
      } as CambiarCorreoSuccessResponse);
    } catch (error) {
      console.error("Error al verificar correo electrónico:", error);

      // Manejar error del servicio de correo
      if (
        (error instanceof Error &&
          error.message === "No se pudo enviar el correo de verificación") ||
        ((error as any).name === "Error" &&
          (error as Error).message.includes("gmail"))
      ) {
        return res.status(500).json({
          success: false,
          message: "Error al enviar el correo electrónico de verificación",
          errorType: SystemErrorTypes.EXTERNAL_SERVICE_ERROR,
          details: (error as any).message,
        } as ErrorResponseAPIBase);
      }

      // Intentar manejar el error con la función específica para errores SQL
      const handledError = handleSQLError(error);
      if (handledError) {
        return res.status(handledError.status).json(handledError.response);
      }

      return res.status(500).json({
        success: false,
        message:
          "Error al procesar la solicitud de cambio de correo electrónico",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: error,
      } as ErrorResponseAPIBase);
    }
  }) as any
);

// Endpoint para confirmar el cambio de correo con el código OTP
router.post(
  "/confirmar-correo",
  isDirectivoAuthenticated,
  isTutorAuthenticated,
  checkAuthentication as any,
  (async (req: Request, res: Response) => {
    try {
      const userData = req.user!;
      const userRole = req.userRole!;
      const rdp02EnUso = req.RDP02_INSTANCE!;
      const { codigo, nuevoCorreo } = req.body as ConfirmarCorreoRequestBody;

      // Verificar que el rol es uno de los permitidos
      if (
        userRole !== RolesSistema.Directivo &&
        userRole !== RolesSistema.Tutor
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Este endpoint solo está disponible para Directivos y Tutores",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar que se proporcionaron los parámetros necesarios
      if (!codigo || !nuevoCorreo) {
        return res.status(400).json({
          success: false,
          message:
            "Se requiere el código de verificación y el nuevo correo electrónico",
          errorType: RequestErrorTypes.MISSING_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar el formato del correo electrónico nuevamente
      const validators: ValidatorConfig[] = [
        { field: "nuevoCorreo", validator: validateEmail },
      ];

      // Validar el correo electrónico
      const validationResult = validateData({ nuevoCorreo }, validators);

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: validationResult.errorMessage,
          errorType: validationResult.errorType,
        } as ErrorResponseAPIBase);
      }

      // Obtener ID del usuario según su rol
      const idUsuario =
        userRole === RolesSistema.Directivo
          ? String((userData as DirectivoAuthenticated).Id_Directivo)
          : (userData as ProfesorTutorSecundariaAuthenticated)
              .DNI_Profesor_Secundaria;

      // Timestamp actual
      const ahora = Date.now();

      // Buscar el código OTP en la base de datos comparando timestamps
      const codigoOTP = await buscarCodigoOTP(
        {
          Codigo: codigo,
          Correo_Destino: nuevoCorreo,
          Rol_Usuario: userRole,
          Id_Usuario: idUsuario,
          Fecha_Expiracion_Min: ahora, // No ha expirado (timestamp actual es menor que expiración)
        },
        rdp02EnUso
      );

      if (!codigoOTP) {
        return res.status(400).json({
          success: false,
          message: "Código de verificación inválido o expirado",
          errorType: ValidationErrorTypes.INVALID_FORMAT,
        } as ErrorResponseAPIBase);
      }

      // Actualizar el correo electrónico en la base de datos según el rol
      if (userRole === RolesSistema.Directivo) {
        await actualizarCorreoDirectivo(
          (userData as DirectivoAuthenticated).Id_Directivo,
          nuevoCorreo,
          rdp02EnUso
        );
      } else {
        // Rol es Tutor
        await actualizarCorreoProfesorTutorSecundaria(
          (userData as ProfesorTutorSecundariaAuthenticated)
            .DNI_Profesor_Secundaria,
          nuevoCorreo,
          rdp02EnUso
        );
      }

      // Eliminar el código OTP utilizado
      await eliminarCodigoOTP(codigoOTP.Id_Codigo_OTP, rdp02EnUso);

      return res.status(200).json({
        success: true,
        message: "Correo electrónico actualizado correctamente",
      } as SuccessResponseAPIBase);
    } catch (error) {
      console.error("Error al confirmar cambio de correo electrónico:", error);

      // Intentar manejar el error con la función específica para errores SQL
      const handledError = handleSQLError(error);
      if (handledError) {
        return res.status(handledError.status).json(handledError.response);
      }

      return res.status(500).json({
        success: false,
        message:
          "Error al procesar la confirmación de cambio de correo electrónico",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: error,
      } as ErrorResponseAPIBase);
    }
  }) as any
);

export default router;
