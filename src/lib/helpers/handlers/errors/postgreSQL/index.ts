import { ValidationErrorTypes } from "../../../../../interfaces/shared/errors";
import { ErrorResponseAPIBase } from "../../../../../interfaces/shared/apis/types";


interface HandledErrorResponse {
  status: number;
  response: ErrorResponseAPIBase;
}

interface FriendlyFieldNames {
  [key: string]: string;
}

/**
 * Maneja errores SQL comunes y los transforma en respuestas estructuradas
 * @param error Error capturado durante la ejecución de las consultas SQL
 * @param friendlyFieldNames Opcionalmente, un mapa de nombres técnicos a nombres amigables
 * @returns Objeto con status y response en formato ErrorResponseAPIBase, o null si no se pudo manejar
 */
export function handleSQLError(
  error: any,
  friendlyFieldNames?: FriendlyFieldNames
): HandledErrorResponse | null {
  // Verificar si es un error de PostgreSQL
  if (error?.code) {
    // Errores de unicidad (código 23505)
    if (error.code === "23505") {
      return handleUniqueConstraintError(error, friendlyFieldNames);
    }

    // Errores de integridad referencial (código 23503)
    if (error.code === "23503") {
      return {
        status: 400,
        response: {
          success: false,
          message:
            "La operación no se pudo completar debido a restricciones de integridad referencial",
          errorType: ValidationErrorTypes.INVALID_REFERENCE,
          details: error.detail || error.message,
        },
      };
    }

    // Errores de tipo de datos (código 22003, 22P02)
    if (error.code === "22003" || error.code === "22P02") {
      return {
        status: 400,
        response: {
          success: false,
          message: "Uno o más valores tienen un formato o tipo incorrecto",
          errorType: ValidationErrorTypes.INVALID_FORMAT,
          details: error.detail || error.message,
        },
      };
    }
  }

  // Si no es un error específico de PostgreSQL o no se pudo manejar
  return null;
}

/**
 * Maneja específicamente errores de unicidad en PostgreSQL
 * @param error Error de PostgreSQL (código 23505)
 * @param friendlyFieldNames Mapa de nombres técnicos a nombres amigables
 * @returns Objeto con status y response en formato ErrorResponseAPIBase
 */
function handleUniqueConstraintError(
  error: any,
  friendlyFieldNames?: FriendlyFieldNames
): HandledErrorResponse {
  let fieldName = "";

  // Intentar extraer el nombre del campo desde el mensaje de error
  const detailMatch = error.detail?.match(/Key \((.*?)\)=/);
  if (detailMatch && detailMatch[1]) {
    fieldName = detailMatch[1];
  }

  // Usar nombre amigable si está disponible
  const friendlyName = friendlyFieldNames?.[fieldName] || fieldName;

  return {
    status: 409,
    response: {
      success: false,
      message: `El valor para "${friendlyName}" ya está en uso`,
      errorType: ValidationErrorTypes.VALUE_ALREADY_EXISTS,
      details: {
        field: fieldName,
        friendlyField: friendlyName,
        originalError: error.detail || error.message,
      },
    },
  };
}
