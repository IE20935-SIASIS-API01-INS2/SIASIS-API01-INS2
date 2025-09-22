import { Request, Response, Router, NextFunction } from "express";
import { generateAuxiliarToken } from "../../../../lib/helpers/functions/jwt/generators/auxiliarToken";
import { verifyAuxiliarPassword } from "../../../../lib/helpers/encriptations/auxiliar.encriptation";
import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import { Genero } from "../../../../interfaces/shared/Genero";
import {
  LoginBody,
  ResponseSuccessLogin,
} from "../../../../interfaces/shared/apis/shared/login/types";
import {
  RequestErrorTypes,
  UserErrorTypes,
  SystemErrorTypes,
} from "../../../../interfaces/shared/errors";
import { ErrorResponseAPIBase } from "../../../../interfaces/shared/apis/types";
import { verificarBloqueoRol } from "../../../../lib/helpers/verificators/verificarBloqueoRol";
import { buscarAuxiliarPorNombreUsuarioSelect } from "../../../../../core/databases/queries/RDP02/auxiliares/buscarAuxiliarPorNombreDeUsuario";

const router = Router();

router.get("/", (async (req: Request, res: Response) => {
  return res.json({ message: "Login Auxiliar" });
}) as any);

// Ruta de login para Auxiliares
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

    // Verificar si el rol de auxiliar está bloqueado
    try {
      const bloqueoRol = await verificarBloqueoRol(req, RolesSistema.Auxiliar, next);

      // Si hay bloqueo, el error ya está configurado en req.authError
      if (bloqueoRol) {
        const errorResponse: ErrorResponseAPIBase = {
          success: false,
          message: req.authError?.message || "El acceso está bloqueado",
          errorType: req.authError?.type || SystemErrorTypes.UNKNOWN_ERROR,
          details: req.authError?.details,
        };

        return res.status(403).json(errorResponse);
      }
    } catch (error) {
      console.error("Error al verificar bloqueo de rol:", error);
      // No bloqueamos el inicio de sesión por errores en la verificación
    }

    // Buscar el auxiliar por nombre de usuario con campos específicos
    const auxiliar = await buscarAuxiliarPorNombreUsuarioSelect(
      Nombre_Usuario,
      [
        "Id_Auxiliar",
        "Nombre_Usuario",
        "Contraseña",
        "Nombres",
        "Apellidos",
        "Google_Drive_Foto_ID",
        "Genero",
        "Estado",
      ]
    );

    // Si no existe el auxiliar, retornar error
    if (!auxiliar) {
      const errorResponse: ErrorResponseAPIBase = {
        success: false,
        message: "Credenciales inválidas",
        errorType: UserErrorTypes.INVALID_CREDENTIALS,
      };
      return res.status(401).json(errorResponse);
    }

    // Verificar si la cuenta está activa
    if (!auxiliar.Estado) {
      const errorResponse: ErrorResponseAPIBase = {
        success: false,
        message: "Tu cuenta está inactiva. Contacta al administrador.",
        errorType: UserErrorTypes.USER_INACTIVE,
      };
      return res.status(403).json(errorResponse);
    }

    // Verificar la contraseña
    const isContraseñaValid = verifyAuxiliarPassword(
      Contraseña,
      auxiliar.Contraseña
    );

    if (!isContraseñaValid) {
      const errorResponse: ErrorResponseAPIBase = {
        success: false,
        message: "Credenciales inválidas",
        errorType: UserErrorTypes.INVALID_CREDENTIALS,
      };
      return res.status(401).json(errorResponse);
    }

    // Generar token JWT
    const token = generateAuxiliarToken(
      auxiliar.Id_Auxiliar,
      auxiliar.Nombre_Usuario
    );

    const response: ResponseSuccessLogin = {
      success: true,
      message: "Inicio de sesión exitoso",
      data: {
        Apellidos: auxiliar.Apellidos,
        Nombres: auxiliar.Nombres,
        Rol: RolesSistema.Auxiliar,
        token,
        Google_Drive_Foto_ID: auxiliar.Google_Drive_Foto_ID,
        Genero: auxiliar.Genero as Genero,
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