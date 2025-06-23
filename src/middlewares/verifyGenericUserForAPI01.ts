import { Request, Response } from "express";

import { TokenErrorTypes } from "../interfaces/shared/errors";
import { ErrorResponseAPIBase } from "../interfaces/shared/apis/types";
import verifyGenericJWTToken from "../lib/helpers/functions/jwt/verifyGenericJWTToken";
import { RolesSistema } from "../interfaces/shared/RolesSistema";

const verifyGenericUserForAPI01 = (
  req: Request,
  res: Response,
  next: Function
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado",
        errorType: TokenErrorTypes.TOKEN_MISSING,
      } as ErrorResponseAPIBase);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Formato de token inválido",
        errorType: TokenErrorTypes.TOKEN_INVALID_FORMAT,
      } as ErrorResponseAPIBase);
    }

    // Verificación preliminar del token
    const preliminaryCheck = verifyGenericJWTToken(token);
    if (!preliminaryCheck.isValid) {
      return res.status(401).json({
        success: false,
        message: preliminaryCheck.message,
        errorType: preliminaryCheck.errorType,
      } as ErrorResponseAPIBase);
    }

    // Verificar que el rol no sea Responsable
    if (preliminaryCheck.payload?.Rol === RolesSistema.Responsable) {
      return res.status(403).json({
        success: false,
        message: "Los usuarios con rol Responsable no tienen acceso a esta API",
        errorType: TokenErrorTypes.TOKEN_WRONG_ROLE,
      } as ErrorResponseAPIBase);
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Error al verificar el token",
      errorType: TokenErrorTypes.TOKEN_MALFORMED,
    } as ErrorResponseAPIBase);
  }
};

export default verifyGenericUserForAPI01;
