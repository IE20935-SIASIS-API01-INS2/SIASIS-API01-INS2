import { NextFunction, Request, Response } from "express";
import { RolesSistema } from "../interfaces/shared/RolesSistema";
import { RequestErrorTypes } from "../interfaces/shared/errors";
import { ErrorResponseAPIBase } from "../interfaces/shared/apis/types";

/**
 * Verifica si se recibieron todos los parámetros de consulta obligatorios
 * @param requiredParams Array con los nombres de los parámetros obligatorios
 * @returns Middleware para Express
 */
const wereObligatoryQueryParamsReceived = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingParams: string[] = [];

    // Verificar cada parámetro obligatorio
    for (const paramName of requiredParams) {
      if (req.query[paramName] === undefined || req.query[paramName] === "") {
        missingParams.push(paramName);
      }
    }

    // Si hay parámetros obligatorios faltantes, devolver error
    if (missingParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan parámetros obligatorios: ${missingParams.join(", ")}`,
        errorType: RequestErrorTypes.MISSING_PARAMETERS,
        missingParams,
      } as ErrorResponseAPIBase);
    }

    //Si se recibio el query param de Rol entonces debe ser uno de los siguientes 6 roles si o si
    if (
      req.query.Rol &&
      req.query.Rol !== RolesSistema.Directivo &&
      req.query.Rol !== RolesSistema.ProfesorPrimaria &&
      req.query.Rol !== RolesSistema.Auxiliar &&
      req.query.Rol !== RolesSistema.ProfesorSecundaria &&
      req.query.Rol !== RolesSistema.Tutor &&
      req.query.Rol !== RolesSistema.PersonalAdministrativo
    ) {
      return res.status(400).json({
        success: false,
        message: "Rol no soportado",
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      });
    }

    // Si todos los parámetros obligatorios están presentes, continuar
    next();
  };
};

export default wereObligatoryQueryParamsReceived;
