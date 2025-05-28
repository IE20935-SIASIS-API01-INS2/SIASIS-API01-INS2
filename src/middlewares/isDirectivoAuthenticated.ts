import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RolesSistema } from "../interfaces/shared/RolesSistema";
import { verificarBloqueoRol } from "../lib/helpers/verificators/verificarBloqueoRol";
import {
  DirectivoAuthenticated,
  JWTPayload,
} from "../interfaces/shared/JWTPayload";
import { ErrorObjectGeneric } from "../interfaces/shared/apis/errors/details";
import {
  SystemErrorTypes,
  TokenErrorTypes,
  UserErrorTypes,
} from "../interfaces/shared/apis/errors";
import { buscarDirectivoPorId } from "../../core/databases/queries/RDP02/directivos/buscarDirectivoPorId";

// Middleware para verificar si el usuario es un Directivo
const isDirectivoAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.userRole && req.userRole !== RolesSistema.Directivo) {
      return next();
    }

    // Si ya está autenticado con algún rol o ya hay un error, continuar
    if (req.isAuthenticated || req.authError) {
      return next();
    }

    // Obtener el token del encabezado de autorización
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // Solo establecer error si estamos seguros que este es el rol correcto (por query param)
      if (req.query.Rol === RolesSistema.Directivo) {
        req.authError = {
          type: TokenErrorTypes.TOKEN_MISSING,
          message: "No se ha proporcionado un token de autenticación",
        };
      }
      return next();
    }

    // Verificar el formato "Bearer <token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      // Solo establecer error si estamos seguros que este es el rol correcto (por query param)
      if (req.query.Rol === RolesSistema.Directivo) {
        req.authError = {
          type: TokenErrorTypes.TOKEN_INVALID_FORMAT,
          message: "Formato de token no válido",
        };
      }
      return next();
    }

    const token = parts[1];
    const jwtSecretKey = process.env.JWT_KEY_DIRECTIVOS!;

    try {
      // Si no tenemos el parámetro Rol, verificar primero si este token es para este rol
      if (!req.query.Rol) {
        try {
          // Intentar verificar si el token es para este rol
          const decoded = jwt.decode(token) as JWTPayload;
          if (!decoded || decoded.Rol !== RolesSistema.Directivo) {
            return next(); // No es para este rol, continuar al siguiente middleware
          }
        } catch (error) {
          // Error al decodificar, probablemente no es para este rol
          return next();
        }
      }

      // A partir de aquí, sabemos que el token debería ser para un Directivo
      // Proceder con la verificación completa
      const decodedPayload = jwt.verify(token, jwtSecretKey) as JWTPayload;

      // Verificar que el rol sea de Directivo (doble verificación)
      if (decodedPayload.Rol !== RolesSistema.Directivo) {
        req.authError = {
          type: TokenErrorTypes.TOKEN_WRONG_ROLE,
          message: "El token no corresponde a un usuario directivo",
        };
        return next();
      }

      // Verificar si el rol está bloqueado
      try {
        const bloqueado = await verificarBloqueoRol(
          req,
          RolesSistema.Directivo,
          next
        );

        if (bloqueado) {
          return; // La función verificarBloqueoRol ya llamó a next()
        }

        // Verificar si el directivo existe
        // Aquí reemplazamos la llamada directa a Prisma por nuestra función desacoplada
        const directivo = await buscarDirectivoPorId(
          Number(decodedPayload.ID_Usuario)
        );

        if (!directivo) {
          req.authError = {
            type: UserErrorTypes.USER_INACTIVE,
            message: "La cuenta de directivo no existe",
          };
          return next();
        }
      } catch (dbError) {
        req.authError = {
          type: SystemErrorTypes.DATABASE_ERROR,
          message: "Error al verificar el estado del usuario o rol",
          details: dbError as ErrorObjectGeneric,
        };
        return next();
      }

      // Agregar información del usuario decodificada a la solicitud para uso posterior
      req.user = {
        Id_Directivo: Number(decodedPayload.ID_Usuario),
        Nombre_Usuario: decodedPayload.Nombre_Usuario,
      } as DirectivoAuthenticated;

      // Marcar como autenticado para que los siguientes middlewares no reprocesen
      req.isAuthenticated = true;
      req.userRole = RolesSistema.Directivo;
      req.RDP02_INSTANCE = decodedPayload.RDP02_INSTANCE;

      // Si todo está bien, continuar
      next();
    } catch (jwtError: any) {
      // Ahora sabemos que el token era para este rol pero falló la verificación

      // Capturar errores específicos de JWT
      if (jwtError.name === "TokenExpiredError") {
        req.authError = {
          type: TokenErrorTypes.TOKEN_EXPIRED,
          message: "El token ha expirado",
          details: {
            expiredAt: jwtError.expiredAt,
          },
        };
      } else if (jwtError.name === "JsonWebTokenError") {
        if (jwtError.message === "invalid signature") {
          req.authError = {
            type: TokenErrorTypes.TOKEN_INVALID_SIGNATURE,
            message: "La firma del token es inválida para directivo",
          };
        } else {
          req.authError = {
            type: TokenErrorTypes.TOKEN_MALFORMED,
            message: "El token tiene un formato incorrecto",
            details: jwtError.message,
          };
        }
      } else {
        req.authError = {
          type: SystemErrorTypes.UNKNOWN_ERROR,
          message: "Error desconocido al verificar el token",
          details: jwtError,
        };
      }
      // Continuar al siguiente middleware
      next();
    }
  } catch (error) {
    console.error("Error en middleware de directivo:", error);
    req.authError = {
      type: SystemErrorTypes.UNKNOWN_ERROR,
      message: "Error desconocido en el proceso de autenticación",
      details: error as ErrorObjectGeneric,
    };
    next();
  }
};

export default isDirectivoAuthenticated;
