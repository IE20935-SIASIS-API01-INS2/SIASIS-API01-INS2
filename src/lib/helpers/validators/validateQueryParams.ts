import { Request } from "express";
import { AuthErrorTypes } from "../../../interfaces/shared/apis/errors/SystemErrorTypes";

export interface ValidationRules {
  [param: string]: {
    required: boolean;
    validator?: (value: any) => boolean;
    errorMessage?: string;
    errorType?: AuthErrorTypes;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    param: string;
    message: string;
    errorType: AuthErrorTypes;
  }[];
}

/**
 * Valida los parámetros de consulta según las reglas especificadas
 * @param req - Objeto Request de Express
 * @param rules - Reglas de validación para los parámetros
 * @returns Resultado de la validación
 */
export function validateQueryParams(
  req: Request,
  rules: ValidationRules
): ValidationResult {
  const errors: any[] = [];

  for (const [param, rule] of Object.entries(rules)) {
    const value = req.query[param];

    // Verificar si el parámetro es requerido y no está presente
    if (
      rule.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push({
        param,
        message: rule.errorMessage || `El parámetro '${param}' es obligatorio`,
        errorType: rule.errorType || AuthErrorTypes.INVALID_PARAMETERS,
      });
      continue;
    }

    // Si el parámetro está presente y tiene un validador, verificar que el valor sea válido
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      rule.validator
    ) {
      if (!rule.validator(value)) {
        errors.push({
          param,
          message:
            rule.errorMessage ||
            `El valor del parámetro '${param}' no es válido`,
          errorType: rule.errorType || AuthErrorTypes.INVALID_PARAMETERS,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
