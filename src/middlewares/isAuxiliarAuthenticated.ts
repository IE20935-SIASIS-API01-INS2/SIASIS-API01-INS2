import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RolesSistema } from "../interfaces/shared/RolesSistema";
import {
  AuxiliarAuthenticated,
  JWTPayload,
} from "../interfaces/shared/JWTPayload";
import { verificarBloqueoRol } from "../lib/helpers/verificators/verificarBloqueoRol";
import { ErrorObjectGeneric } from "../interfaces/shared/errors/details";
import {
  SystemErrorTypes,
  TokenErrorTypes,
  UserErrorTypes,
} from "../interfaces/shared/errors";
import { buscarAuxiliarPorDNISelect } from "../../core/databases/queries/RDP02/auxiliares/buscarAuxiliarPorDNI";

// Middleware para verificar si el usuario es un Auxiliar
const isAuxiliarAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.userRole && req.userRole !== RolesSistema.Auxiliar) {
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
      if (req.query.Rol === RolesSistema.Auxiliar) {
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
      if (req.query.Rol === RolesSistema.Auxiliar) {
        req.authError = {
          type: TokenErrorTypes.TOKEN_INVALID_FORMAT,
          message: "Formato de token no válido",
        };
      }
      return next();
    }

    const token = parts[1];
    const jwtSecretKey = process.env.JWT_KEY_AUXILIARES!;

    // Si no tenemos el parámetro Rol, intentar determinar si este token es para este rol
    if (!req.query.Rol) {
      try {
        // Intentar decodificar para ver si el token es para este rol
        const decoded = jwt.decode(token) as JWTPayload;
        if (!decoded || decoded.Rol !== RolesSistema.Auxiliar) {
          return next(); // No es para este rol, continuar al siguiente middleware
        }
      } catch (error) {
        // Error al decodificar, probablemente no es para este rol
        return next();
      }
    }

    try {
      // A partir de aquí, sabemos que el token debería ser para un Auxiliar
      // Proceder con la verificación completa
      const decodedPayload = jwt.verify(token, jwtSecretKey) as JWTPayload;

      // Verificar que el rol sea de Auxiliar (doble verificación)
      if (decodedPayload.Rol !== RolesSistema.Auxiliar) {
        req.authError = {
          type: TokenErrorTypes.TOKEN_WRONG_ROLE,
          message: "El token no corresponde a un usuario auxiliar",
        };
        return next();
      }

      try {
        // Verificar si el rol está bloqueado
        const bloqueado = await verificarBloqueoRol(
          req,
          RolesSistema.Auxiliar,
          next
        );

        if (bloqueado) {
          return; // La función verificarBloqueoRol ya llamó a next()
        }

        // Verificar si el auxiliar existe y está activo
        // Aquí reemplazamos la llamada directa a Prisma por nuestra función desacoplada
        const auxiliar = await buscarAuxiliarPorDNISelect(
          decodedPayload.ID_Usuario,
          ["Estado"]
        );

        if (!auxiliar || !auxiliar.Estado) {
          req.authError = {
            type: UserErrorTypes.USER_INACTIVE,
            message: "La cuenta de auxiliar está inactiva o no existe",
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
        DNI_Auxiliar: decodedPayload.ID_Usuario,
        Nombre_Usuario: decodedPayload.Nombre_Usuario,
      } as AuxiliarAuthenticated;

      // Marcar como autenticado para que los siguientes middlewares no reprocesen
      req.isAuthenticated = true;
      req.userRole = RolesSistema.Auxiliar;
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
            message: "La firma del token es inválida para auxiliar",
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
    console.error("Error en middleware de auxiliar:", error);
    req.authError = {
      type: SystemErrorTypes.UNKNOWN_ERROR,
      message: "Error desconocido en el proceso de autenticación",
      details: error as ErrorObjectGeneric,
    };
    next();
  }
};

export default isAuxiliarAuthenticated;
