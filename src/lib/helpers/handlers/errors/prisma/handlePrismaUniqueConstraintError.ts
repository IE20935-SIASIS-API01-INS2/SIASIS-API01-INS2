import { DataConflictErrorTypes } from "../../../../../interfaces/shared/errors";
import { ErrorResponseAPIBase } from "../../../../../interfaces/shared/apis/types";

/**
 * Maneja errores de restricción única (P2002) de Prisma
 * @param error - Error de Prisma con código P2002
 * @param friendlyFieldNames - Mapeo de nombres de campos técnicos a nombres amigables
 * @returns Objeto de respuesta formateado
 */
export function handlePrismaUniqueConstraintError(
  error: any,
  friendlyFieldNames: Record<string, string> = {}
): ErrorResponseAPIBase {
  // Extraer el campo que causó el conflicto
  const target = (error.meta?.target as string[]) || [];
  const fieldWithConflict = target.length > 0 ? target[0] : "campo";

  // Usar el nombre amigable si existe, o el nombre técnico si no
  const friendlyFieldName =
    friendlyFieldNames[fieldWithConflict] || fieldWithConflict;

  return {
    success: false,
    message: `El ${friendlyFieldName} proporcionado ya está en uso por otro usuario`,
    errorType: DataConflictErrorTypes.VALUE_ALREADY_IN_USE,
    conflictField: fieldWithConflict,
    details: error,
  };
}
