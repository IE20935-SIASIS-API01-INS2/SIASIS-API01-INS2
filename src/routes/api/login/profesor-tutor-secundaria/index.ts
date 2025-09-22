import { Request, Response, Router, NextFunction } from "express";
import { generateProfesorSecundariaToken } from "../../../../lib/helpers/functions/jwt/generators/profesorSecundariaToken";
import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import { Genero } from "../../../../interfaces/shared/Genero";
import { generateTutorToken } from "../../../../lib/helpers/functions/jwt/generators/tutorToken";
import { verifyProfesorTutorSecundariaPassword } from "../../../../lib/helpers/encriptations/profesorTutotSecundaria.encriptation";
import {
  LoginBody,
  ResponseSuccessLogin,
} from "../../../../interfaces/shared/apis/shared/login/types";
import {
  RequestErrorTypes,
  UserErrorTypes,
  SystemErrorTypes,
  PermissionErrorTypes,
} from "../../../../interfaces/shared/errors";
import { ErrorResponseAPIBase } from "../../../../interfaces/shared/apis/types";
import { consultarBloqueoRol } from "../../../../lib/helpers/verificators/verificarBloqueoRol";
import { buscarProfesorSecundariaConAulasPorNombreDeUsuario } from "../../../../../core/databases/queries/RDP02/profesor-secundaria/buscarProfesoresSecundariaPorNombreDeUsuario";

const router = Router();

router.get("/", (async (req: Request, res: Response) => {
  return res.json({ message: "Login Profesor Secundaria / Tutor" });
}) as any);

// Ruta de login para Profesores de Secundaria / Tutores
router.post("/", (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Nombre_Usuario, Contraseña }: LoginBody = req.body;

    // Validar que se proporcionen ambos campos
    if (!Nombre_Usuario || !Contraseña) {
      const errorResponse: ErrorResponseAPIBase = {
        success: false,
        message: "El nombre de usuario y la contraseña son obligatorios",
        errorType: RequestErrorTypes.MISSING_PARAMETERS,
      };
      return res.status(400).json(errorResponse);
    }

    // Este endpoint maneja dos roles: verificar bloqueos para ambos
    try {

      
      const bloqueoProfesorSecundaria = await consultarBloqueoRol(
        RolesSistema.ProfesorSecundaria
      );
      const bloqueoTutor = await consultarBloqueoRol(RolesSistema.Tutor);

      // Si hay algún bloqueo, procesarlo
      if (bloqueoProfesorSecundaria || bloqueoTutor) {
        let mensajeError = "";
        let esBloqueoPermanente = false;
        let timestampDesbloqueo = 0;

        // Lógica para determinar qué bloqueo reportar
        if (bloqueoProfesorSecundaria && bloqueoTutor) {
          // Ambos roles bloqueados
          const profesorPermanente =
            bloqueoProfesorSecundaria.Bloqueo_Total ||
            Number(bloqueoProfesorSecundaria.Timestamp_Desbloqueo) <=
              Math.floor(Date.now() / 1000);
          const tutorPermanente =
            bloqueoTutor.Bloqueo_Total ||
            Number(bloqueoTutor.Timestamp_Desbloqueo) <=
              Math.floor(Date.now() / 1000);

          if (profesorPermanente && tutorPermanente) {
            mensajeError =
              "El acceso a profesores y tutores de secundaria está permanentemente bloqueado";
            esBloqueoPermanente = true;
          } else if (profesorPermanente) {
            mensajeError =
              "El acceso para profesores de secundaria está permanentemente bloqueado";
            esBloqueoPermanente = true;
          } else if (tutorPermanente) {
            mensajeError =
              "El acceso para tutores está permanentemente bloqueado";
            esBloqueoPermanente = true;
          } else {
            // Ninguno permanente, usar el de mayor timestamp
            const timestampProfesor = Number(
              bloqueoProfesorSecundaria.Timestamp_Desbloqueo
            );
            const timestampTutor = Number(bloqueoTutor.Timestamp_Desbloqueo);
            timestampDesbloqueo = Math.max(timestampProfesor, timestampTutor);
            mensajeError =
              "El acceso a profesores y tutores de secundaria está temporalmente bloqueado";
          }
        } else if (bloqueoProfesorSecundaria) {
          // Solo profesor bloqueado
          esBloqueoPermanente =
            bloqueoProfesorSecundaria.Bloqueo_Total ||
            Number(bloqueoProfesorSecundaria.Timestamp_Desbloqueo) <=
              Math.floor(Date.now() / 1000);
          timestampDesbloqueo = Number(
            bloqueoProfesorSecundaria.Timestamp_Desbloqueo
          );
          mensajeError = esBloqueoPermanente
            ? "El acceso para profesores de secundaria está permanentemente bloqueado"
            : "El acceso para profesores de secundaria está temporalmente bloqueado";
        } else if (bloqueoTutor) {
          // Solo tutor bloqueado
          esBloqueoPermanente =
            bloqueoTutor.Bloqueo_Total ||
            Number(bloqueoTutor.Timestamp_Desbloqueo) <=
              Math.floor(Date.now() / 1000);
          timestampDesbloqueo = Number(bloqueoTutor.Timestamp_Desbloqueo);
          mensajeError = esBloqueoPermanente
            ? "El acceso para tutores está permanentemente bloqueado"
            : "El acceso para tutores está temporalmente bloqueado";
        }

        // Calcular detalles de tiempo si no es permanente
        let tiempoRestante = "Permanente";
        let fechaFormateada = "No definida";

        if (!esBloqueoPermanente && timestampDesbloqueo > 0) {
          const tiempoActual = Math.floor(Date.now() / 1000);
          const tiempoRestanteSegundos = timestampDesbloqueo - tiempoActual;
          const horasRestantes = Math.floor(tiempoRestanteSegundos / 3600);
          const minutosRestantes = Math.floor(
            (tiempoRestanteSegundos % 3600) / 60
          );
          tiempoRestante = `${horasRestantes}h ${minutosRestantes}m`;

          const fechaDesbloqueo = new Date(timestampDesbloqueo * 1000);
          fechaFormateada = fechaDesbloqueo.toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        const errorResponse: ErrorResponseAPIBase = {
          success: false,
          message: mensajeError,
          errorType: PermissionErrorTypes.ROLE_BLOCKED,
          details: {
            tiempoActualUTC: Math.floor(Date.now() / 1000),
            timestampDesbloqueoUTC: timestampDesbloqueo,
            tiempoRestante: tiempoRestante,
            fechaDesbloqueo: fechaFormateada,
            esBloqueoPermanente: esBloqueoPermanente,
          },
        };

        return res.status(403).json(errorResponse);
      }
    } catch (error) {
      console.error("Error al verificar bloqueo de rol:", error);
      // No bloqueamos el inicio de sesión por errores en la verificación
    }

    // Buscar el profesor de secundaria por nombre de usuario
    const profesorSecundaria =
      await buscarProfesorSecundariaConAulasPorNombreDeUsuario(Nombre_Usuario);

    // Si no existe el profesor de secundaria, retornar error
    if (!profesorSecundaria) {
      const errorResponse: ErrorResponseAPIBase = {
        success: false,
        message: "Credenciales inválidas",
        errorType: UserErrorTypes.INVALID_CREDENTIALS,
      };
      return res.status(401).json(errorResponse);
    }

    // Verificar si la cuenta está activa
    if (!profesorSecundaria.Estado) {
      const errorResponse: ErrorResponseAPIBase = {
        success: false,
        message: "Tu cuenta está inactiva. Contacta al administrador.",
        errorType: UserErrorTypes.USER_INACTIVE,
      };
      return res.status(403).json(errorResponse);
    }

    // Verificar la contraseña
    const isContraseñaValid = verifyProfesorTutorSecundariaPassword(
      Contraseña,
      profesorSecundaria.Contraseña
    );

    if (!isContraseñaValid) {
      const errorResponse: ErrorResponseAPIBase = {
        success: false,
        message: "Credenciales inválidas",
        errorType: UserErrorTypes.INVALID_CREDENTIALS,
      };
      return res.status(401).json(errorResponse);
    }

    // Determinar si es tutor (tiene aula asignada)
    const esTutor = profesorSecundaria.aulas.length > 0;

    // Generar token JWT según el rol
    let token;
    let rol;

    if (esTutor) {
      token = generateTutorToken(
        profesorSecundaria.Id_Profesor_Secundaria,
        profesorSecundaria.Nombre_Usuario
      );
      rol = RolesSistema.Tutor;
    } else {
      token = generateProfesorSecundariaToken(
        profesorSecundaria.Id_Profesor_Secundaria,
        profesorSecundaria.Nombre_Usuario
      );
      rol = RolesSistema.ProfesorSecundaria;
    }

    const response: ResponseSuccessLogin = {
      success: true,
      message: "Inicio de sesión exitoso",
      data: {
        Apellidos: profesorSecundaria.Apellidos,
        Nombres: profesorSecundaria.Nombres,
        Rol: rol,
        token,
        Google_Drive_Foto_ID: profesorSecundaria.Google_Drive_Foto_ID,
        Genero: profesorSecundaria.Genero as Genero,
      },
    };

    // Responder con el token y datos básicos del usuario
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error en inicio de sesión:", error);

    const errorResponse: ErrorResponseAPIBase = {
      success: false,
      message: "Error en el servidor, por favor intente más tarde",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: { error: String(error) },
    };

    return res.status(500).json(errorResponse);
  }
}) as any);

export default router;
