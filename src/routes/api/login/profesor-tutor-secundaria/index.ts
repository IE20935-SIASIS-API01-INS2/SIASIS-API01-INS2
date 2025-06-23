// src/routes/auth/login/profesor-secundaria-tutor/index.ts
import { Request, Response, Router } from "express";
import { generateProfesorSecundariaToken } from "../../../../lib/helpers/functions/jwt/generators/profesorSecundariaToken";
import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import { Genero } from "../../../../interfaces/shared/Genero";
import { generateTutorToken } from "../../../../lib/helpers/functions/jwt/generators/tutorToken";
import { verifyProfesorTutorSecundariaPassword } from "../../../../lib/helpers/encriptations/profesorTutotSecundaria.encriptation";
import {
  LoginBody,
  ResponseSuccessLogin,
} from "../../../../interfaces/shared/apis/shared/login/types";
import { AuthBlockedDetails } from "../../../../interfaces/shared/errors/details/AuthBloquedDetails";

import {
  RequestErrorTypes,
  UserErrorTypes,
  PermissionErrorTypes,
  SystemErrorTypes,
} from "../../../../interfaces/shared/errors";
import { ErrorResponseAPIBase } from "../../../../interfaces/shared/apis/types";
import { verificarBloqueoRolProfesorSecundaria } from "../../../../../core/databases/queries/RDP02/bloqueo-roles/verificarBloqueoRolProfesorSecundaria";
import { verificarBloqueoRolTutor } from "../../../../../core/databases/queries/RDP02/bloqueo-roles/verificarBloqueoRolTutorSecundaria";
import { buscarProfesorSecundariaConAulasPorNombreDeUsuario } from "../../../../../core/databases/queries/RDP02/profesor-secundaria/buscarProfesoresSecundariaPorNombreDeUsuario";

const router = Router();

router.get("/", (async (req: Request, res: Response) => {
  return res.json({ message: "Login Profesor Secundaria / Tutor" });
}) as any);

// Ruta de login para Profesores de Secundaria / Tutores
router.post("/", (async (req: Request, res: Response) => {
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

    // Este endpoint se usa tanto para profesores de secundaria como para tutores
    // Verificamos bloqueos para ambos roles antes de continuar
    try {
      const tiempoActual = Math.floor(Date.now() / 1000); // Timestamp Unix actual en segundos

      // Verificar bloqueo para Profesor Secundaria
      const bloqueoProfesorSecundaria =
        await verificarBloqueoRolProfesorSecundaria();

      // Verificar bloqueo para Tutor
      const bloqueoTutor = await verificarBloqueoRolTutor();

      // Si ambos roles están bloqueados, informamos sobre el que tiene mayor tiempo de bloqueo
      // o indicamos que es un bloqueo permanente si ambos lo son
      if (bloqueoProfesorSecundaria && bloqueoTutor) {
        const timestampProfesorSecundaria = Number(
          bloqueoProfesorSecundaria.Timestamp_Desbloqueo
        );
        const timestampTutor = Number(bloqueoTutor.Timestamp_Desbloqueo);

        // Determinar cuál de los dos tiene un timestamp mayor o si ambos son permanentes
        const esProfesorPermanente =
          timestampProfesorSecundaria <= 0 ||
          timestampProfesorSecundaria <= tiempoActual;
        const esTutorPermanente =
          timestampTutor <= 0 || timestampTutor <= tiempoActual;

        // Si ambos son permanentes
        if (esProfesorPermanente && esTutorPermanente) {
          const errorDetails: AuthBlockedDetails = {
            tiempoActualUTC: tiempoActual,
            timestampDesbloqueoUTC: 0,
            tiempoRestante: "Permanente",
            fechaDesbloqueo: "No definida",
            esBloqueoPermanente: true,
          };

          const errorResponse: ErrorResponseAPIBase = {
            success: false,
            message:
              "El acceso a profesores y tutores de secundaria está permanentemente bloqueado",
            errorType: PermissionErrorTypes.ROLE_BLOCKED,
            details: errorDetails,
          };

          return res.status(403).json(errorResponse);
        }

        // Si solo uno es permanente, priorizamos ese
        if (esProfesorPermanente) {
          const errorDetails: AuthBlockedDetails = {
            tiempoActualUTC: tiempoActual,
            timestampDesbloqueoUTC: timestampProfesorSecundaria,
            tiempoRestante: "Permanente",
            fechaDesbloqueo: "No definida",
            esBloqueoPermanente: true,
          };

          const errorResponse: ErrorResponseAPIBase = {
            success: false,
            message:
              "El acceso para profesores de secundaria está permanentemente bloqueado",
            errorType: PermissionErrorTypes.ROLE_BLOCKED,
            details: errorDetails,
          };

          return res.status(403).json(errorResponse);
        }

        if (esTutorPermanente) {
          const errorDetails: AuthBlockedDetails = {
            tiempoActualUTC: tiempoActual,
            timestampDesbloqueoUTC: timestampTutor,
            tiempoRestante: "Permanente",
            fechaDesbloqueo: "No definida",
            esBloqueoPermanente: true,
          };

          const errorResponse: ErrorResponseAPIBase = {
            success: false,
            message: "El acceso para tutores está permanentemente bloqueado",
            errorType: PermissionErrorTypes.ROLE_BLOCKED,
            details: errorDetails,
          };

          return res.status(403).json(errorResponse);
        }

        // Si ninguno es permanente, escogemos el que tenga mayor tiempo de bloqueo
        const bloqueoMasLargo =
          timestampProfesorSecundaria > timestampTutor
            ? bloqueoProfesorSecundaria
            : bloqueoTutor;

        const timestampDesbloqueo = Number(
          bloqueoMasLargo.Timestamp_Desbloqueo
        );
        const tiempoRestanteSegundos = timestampDesbloqueo - tiempoActual;
        const horasRestantes = Math.floor(tiempoRestanteSegundos / 3600);
        const minutosRestantes = Math.floor(
          (tiempoRestanteSegundos % 3600) / 60
        );

        // Formatear fecha de desbloqueo
        const fechaDesbloqueo = new Date(timestampDesbloqueo * 1000);
        const fechaFormateada = fechaDesbloqueo.toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const errorDetails: AuthBlockedDetails = {
          tiempoActualUTC: tiempoActual,
          timestampDesbloqueoUTC: timestampDesbloqueo,
          tiempoRestante: `${horasRestantes}h ${minutosRestantes}m`,
          fechaDesbloqueo: fechaFormateada,
          esBloqueoPermanente: false,
        };

        const errorResponse: ErrorResponseAPIBase = {
          success: false,
          message:
            "El acceso a profesores y tutores de secundaria está temporalmente bloqueado",
          errorType: PermissionErrorTypes.ROLE_BLOCKED,
          details: errorDetails,
        };

        return res.status(403).json(errorResponse);
      }
      // Si solo está bloqueado el rol de profesor de secundaria
      else if (bloqueoProfesorSecundaria) {
        const timestampDesbloqueo = Number(
          bloqueoProfesorSecundaria.Timestamp_Desbloqueo
        );

        // Determinar si es un bloqueo permanente
        const esBloqueoPermanente =
          timestampDesbloqueo <= 0 || timestampDesbloqueo <= tiempoActual;

        let tiempoRestante = "Permanente";
        let fechaFormateada = "No definida";

        if (!esBloqueoPermanente) {
          const tiempoRestanteSegundos = timestampDesbloqueo - tiempoActual;
          const horasRestantes = Math.floor(tiempoRestanteSegundos / 3600);
          const minutosRestantes = Math.floor(
            (tiempoRestanteSegundos % 3600) / 60
          );
          tiempoRestante = `${horasRestantes}h ${minutosRestantes}m`;

          // Formatear fecha de desbloqueo
          const fechaDesbloqueo = new Date(timestampDesbloqueo * 1000);
          fechaFormateada = fechaDesbloqueo.toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        const errorDetails: AuthBlockedDetails = {
          tiempoActualUTC: tiempoActual,
          timestampDesbloqueoUTC: timestampDesbloqueo,
          tiempoRestante: tiempoRestante,
          fechaDesbloqueo: fechaFormateada,
          esBloqueoPermanente: esBloqueoPermanente,
        };

        const errorResponse: ErrorResponseAPIBase = {
          success: false,
          message: esBloqueoPermanente
            ? "El acceso para profesores de secundaria está permanentemente bloqueado"
            : "El acceso para profesores de secundaria está temporalmente bloqueado",
          errorType: PermissionErrorTypes.ROLE_BLOCKED,
          details: errorDetails,
        };

        return res.status(403).json(errorResponse);
      }
      // Si solo está bloqueado el rol de tutor
      else if (bloqueoTutor) {
        const timestampDesbloqueo = Number(bloqueoTutor.Timestamp_Desbloqueo);

        // Determinar si es un bloqueo permanente
        const esBloqueoPermanente =
          timestampDesbloqueo <= 0 || timestampDesbloqueo <= tiempoActual;

        let tiempoRestante = "Permanente";
        let fechaFormateada = "No definida";

        if (!esBloqueoPermanente) {
          const tiempoRestanteSegundos = timestampDesbloqueo - tiempoActual;
          const horasRestantes = Math.floor(tiempoRestanteSegundos / 3600);
          const minutosRestantes = Math.floor(
            (tiempoRestanteSegundos % 3600) / 60
          );
          tiempoRestante = `${horasRestantes}h ${minutosRestantes}m`;

          // Formatear fecha de desbloqueo
          const fechaDesbloqueo = new Date(timestampDesbloqueo * 1000);
          fechaFormateada = fechaDesbloqueo.toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        const errorDetails: AuthBlockedDetails = {
          tiempoActualUTC: tiempoActual,
          timestampDesbloqueoUTC: timestampDesbloqueo,
          tiempoRestante: tiempoRestante,
          fechaDesbloqueo: fechaFormateada,
          esBloqueoPermanente: esBloqueoPermanente,
        };

        const errorResponse: ErrorResponseAPIBase = {
          success: false,
          message: esBloqueoPermanente
            ? "El acceso para tutores está permanentemente bloqueado"
            : "El acceso para tutores está temporalmente bloqueado",
          errorType: PermissionErrorTypes.ROLE_BLOCKED,
          details: errorDetails,
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
        profesorSecundaria.DNI_Profesor_Secundaria,
        profesorSecundaria.Nombre_Usuario
      );
      rol = RolesSistema.Tutor;
    } else {
      token = generateProfesorSecundariaToken(
        profesorSecundaria.DNI_Profesor_Secundaria,
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
