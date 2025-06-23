import { Request, Response, NextFunction } from "express";

import { ErrorResponseAPIBase } from "../interfaces/shared/apis/types";
import {
  PermissionErrorTypes,
  SystemErrorTypes,
  TokenErrorTypes,
  UserErrorTypes,
} from "../interfaces/shared/errors";

// Middleware final que verifica si alguno de los middlewares anteriores
// ha autenticado correctamente al usuario
const checkAuthentication = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated) {
    return next();
  }

  // Si no está autenticado, verificar si hay un error específico
  if (req.authError) {
    const errorResponse: ErrorResponseAPIBase = {
      success: false,
      message: req.authError.message,
      errorType: req.authError.type,
    };

    // Agregar detalles si existen
    if (req.authError.details) {
      errorResponse.details = req.authError.details;
    }

    // Determinar el código de estado HTTP según el tipo de error
    let statusCode = 401; // Unauthorized por defecto

    switch (req.authError.type) {
      case TokenErrorTypes.TOKEN_EXPIRED:
      case TokenErrorTypes.TOKEN_INVALID_SIGNATURE:
      case TokenErrorTypes.TOKEN_MALFORMED:
      case TokenErrorTypes.TOKEN_MISSING:
      case TokenErrorTypes.TOKEN_INVALID_FORMAT:
        statusCode = 401; // Unauthorized
        break;

      case PermissionErrorTypes.ROLE_BLOCKED:
      case UserErrorTypes.USER_INACTIVE:
      case TokenErrorTypes.TOKEN_WRONG_ROLE:
      case PermissionErrorTypes.INSUFFICIENT_PERMISSIONS:
        statusCode = 403; // Forbidden
        break;

      case SystemErrorTypes.DATABASE_ERROR:
      case SystemErrorTypes.UNKNOWN_ERROR:
        statusCode = 500; // Internal Server Error
        break;
    }

    return res.status(statusCode).json(errorResponse);
  }

  // Si no hay un error específico, usar un mensaje genérico
  return res.status(401).json({
    success: false,
    message:
      "Acceso denegado. No tiene los permisos necesarios para acceder a este recurso.",
    errorType: PermissionErrorTypes.INSUFFICIENT_PERMISSIONS,
  });
};

export default checkAuthentication;
