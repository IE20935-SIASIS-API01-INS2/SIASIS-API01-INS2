import { Request, Response, NextFunction } from "express";
import { TokenErrorTypes } from "../interfaces/shared/errors";
import verifyGenericJWTToken from "../lib/helpers/functions/jwt/verifyGenericJWTToken";
import { RolesSistema } from "../interfaces/shared/RolesSistema";
// Middleware para decodificar el token de la cabecera y
// guardar el rol decodificado en el request en el atributo userRole
const decodedRol = async (req: Request, res: Response, next: NextFunction) => {
  // Obtener el token de la cabecera Authorization
  const authHeader = req.headers.authorization;

  // Verificar si existe el header y tiene el formato correcto
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token de autorización no proporcionado o con formato inválido",
      errorType: TokenErrorTypes.TOKEN_MISSING,
    });
  }

  // Extraer el token sin el prefijo 'Bearer '
  const token = authHeader.split(" ")[1];

  // Verificar el token usando la función proporcionada
  const tokenCheck = verifyGenericJWTToken(token);

  if (!tokenCheck.isValid) {
    return res.status(401).json({
      success: false,
      message: tokenCheck.message,
      errorType: tokenCheck.errorType,
    });
  }

  // Verificar que el rol no sea Responsable
  if (tokenCheck.payload?.Rol === RolesSistema.Responsable) {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado para usuarios con rol de Responsable",
      errorType: TokenErrorTypes.TOKEN_UNAUTHORIZED,
    });
  }

  // Guardar la información del rol en el request para uso posterior
  req.userRole = tokenCheck.payload?.Rol;
  // Continuar con el siguiente middleware
  next();
};

export default decodedRol;
