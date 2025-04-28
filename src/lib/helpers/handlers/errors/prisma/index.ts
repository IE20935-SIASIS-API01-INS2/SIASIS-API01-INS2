/**
 * Manejador general de errores de Prisma que delega a manejadores específicos según el código de error
 * @param error - Error generado por Prisma
 * @returns Objeto de respuesta si el error pudo ser manejado, o false si no hay un manejador para el código
 */

import { ErrorResponseAPIBase } from "../../../../../interfaces/shared/apis/types";
import { handlePrismaUniqueConstraintError } from "./handlePrismaUniqueConstraintError";

/**
 * Manejador general de errores de Prisma que delega a manejadores específicos según el código de error
 * @param error - Error generado por Prisma
 * @param friendlyFieldNames - Objeto opcional con mapeo de nombres técnicos a nombres amigables
 * @returns Objeto de respuesta si el error pudo ser manejado, o false si no hay un manejador para el código
 */
export function handlePrismaError(
  error: any,
  friendlyFieldNames: Record<string, string> = {}
):
  | false
  | {
      status: number;
      response: ErrorResponseAPIBase;
    } {
  // Verificar si es un error de Prisma
  if (!error || !error.code) {
    return false;
  }

  // Manejar cada código de error con su función específica
  switch (error.code) {
    case "P2002": // Violación de restricción única
      return {
        status: 409, // Conflict
        response: handlePrismaUniqueConstraintError(error, friendlyFieldNames),
      };

    // Aquí puedes añadir más manejadores para otros códigos de error
    // case 'P2003': // Foreign key constraint failed
    // case 'P2025': // Record not found
    // etc.

    default:
      return false; // No hay un manejador específico para este código
  }
}
