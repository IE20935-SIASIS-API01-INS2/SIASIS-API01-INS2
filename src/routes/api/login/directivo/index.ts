// src/routes/auth/login/directivo/index.ts
import { Router, Request, Response } from "express";
import { generateDirectivoToken } from "../../../../lib/helpers/functions/jwt/generators/directivoToken";
import { verifyDirectivoPassword } from "../../../../lib/helpers/encriptations/directivo.encriptation";
import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import { Genero } from "../../../../interfaces/shared/Genero";
import {
  LoginBody,
  ResponseSuccessLogin,
} from "../../../../interfaces/shared/apis/shared/login/types";
import { AuthBlockedDetails } from "../../../../interfaces/shared/apis/errors/details/AuthBloquedDetails";

import {
  RequestErrorTypes,
  UserErrorTypes,
  PermissionErrorTypes,
  SystemErrorTypes,
} from "../../../../interfaces/shared/apis/errors";
import { ErrorResponseAPIBase } from "../../../../interfaces/shared/apis/types";
import { verificarBloqueoRolDirectivo } from "../../../../../core/databases/queries/RDP02/bloqueo-roles/verificarBloqueoRolDirectivo";
import { buscarDirectivoPorNombreUsuarioSelect } from "../../../../../core/databases/queries/RDP02/directivos/buscarDirectivosPorNombreDeUsuario";

const router = Router();

router.get("/", (async (req: Request, res: Response) => {
  return res.json({ message: "Login Directivo Bienvenido" });
}) as any);

// Ruta de login
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

    // Verificar si el rol de directivo está bloqueado
    try {
      // Verificar bloqueo total
      const bloqueoRol = await verificarBloqueoRolDirectivo();

      // Si hay bloqueo, generar mensaje detallado
      if (bloqueoRol) {
        const tiempoActual = Math.floor(Date.now() / 1000);
        const timestampDesbloqueo = Number(bloqueoRol.Timestamp_Desbloqueo);

        // Determinamos si es un bloqueo permanente (timestamp = 0 o en el pasado)
        const esBloqueoPermanente =
          timestampDesbloqueo <= 0 || timestampDesbloqueo <= tiempoActual;

        // Calculamos el tiempo restante solo si NO es un bloqueo permanente
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
            ? "El acceso para directivos está permanentemente bloqueado"
            : "El acceso para directivos está temporalmente bloqueado",
          errorType: PermissionErrorTypes.ROLE_BLOCKED,
          details: errorDetails,
        };

        return res.status(403).json(errorResponse);
      }
    } catch (error) {
      console.error("Error al verificar bloqueo de rol:", error);
      // No bloqueamos el inicio de sesión por errores en la verificación
    }

    // Buscar el directivo por nombre de usuario con campos específicos
    const directivo = await buscarDirectivoPorNombreUsuarioSelect(
      Nombre_Usuario,
      [
        "Id_Directivo",
        "Nombre_Usuario",
        "Contraseña",
        "Nombres",
        "Apellidos",
        "Google_Drive_Foto_ID",
        "Genero",
      ]
    );

    // Si no existe el directivo, retornar error
    if (!directivo) {
      const errorResponse: ErrorResponseAPIBase = {
        success: false,
        message: "Credenciales inválidas",
        errorType: UserErrorTypes.INVALID_CREDENTIALS,
      };
      return res.status(401).json(errorResponse);
    }

    // Verificar la contraseña
    const isContraseñaValid = verifyDirectivoPassword(
      Contraseña,
      directivo.Contraseña
    );

    if (!isContraseñaValid) {
      // Aquí podrías implementar un contador de intentos fallidos
      // y si supera cierto límite, bloquear temporalmente
      const errorResponse: ErrorResponseAPIBase = {
        success: false,
        message: "Credenciales inválidas",
        errorType: UserErrorTypes.INVALID_CREDENTIALS,
      };
      return res.status(401).json(errorResponse);
    }

    // Generar token JWT
    const token = generateDirectivoToken(
      directivo.Id_Directivo,
      directivo.Nombre_Usuario
    );

    const response: ResponseSuccessLogin = {
      success: true,
      message: "Inicio de sesión exitoso",
      data: {
        Apellidos: directivo.Apellidos,
        Nombres: directivo.Nombres,
        Rol: RolesSistema.Directivo,
        token,
        Google_Drive_Foto_ID: directivo.Google_Drive_Foto_ID,
        Genero: directivo.Genero as Genero,
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
