import { ValidationErrorTypes } from "../../../../interfaces/shared/errors";
import { ValidationResult } from "./types";

export function validateFecha(value: any, required: boolean): ValidationResult {
    if ((value === undefined || value === null)) {
        if (required) {
            return {
                isValid: false,
                errorType: ValidationErrorTypes.FIELD_REQUIRED,
                errorMessage: "El campo de fecha es obligatorio"
            };
        } else {
            return { isValid: true };
        }
    }

    if (!(value instanceof Date) || isNaN(value.getTime())) {
        return {
            isValid: false,
            errorType: ValidationErrorTypes.INVALID_DATE_FORMAT,
            errorMessage: "El campo debe ser una fecha válida"
        };
    }

    return { isValid: true };
}
