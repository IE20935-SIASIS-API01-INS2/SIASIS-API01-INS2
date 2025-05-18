// core/databases/queries/RDP02/personal-administrativo/cambiarEstadoPersonalAdministrativo.ts
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";
import { T_Personal_Administrativo } from "@prisma/client";

/**
 * Cambia el estado (activo/inactivo) de un miembro del personal administrativo
 * @param dniPersonal DNI del personal administrativo a modificar
 * @param nuevoEstado Nuevo estado (opcional). Si no se proporciona, invierte el estado actual
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos actualizados del personal administrativo o null si no se encuentra
 */
export async function cambiarEstadoPersonalAdministrativo(
  dniPersonal: string,
  nuevoEstado?: boolean,
  instanciaEnUso?: RDP02
): Promise<Pick<T_Personal_Administrativo, "DNI_Personal_Administrativo" | "Nombres" | "Apellidos" | "Estado"> | null> {
  try {
    // Primero, verificamos si el personal administrativo existe y obtenemos su estado actual
    const sqlConsulta = `
      SELECT "DNI_Personal_Administrativo", "Estado", "Nombres", "Apellidos"
      FROM "T_Personal_Administrativo"
      WHERE "DNI_Personal_Administrativo" = $1
    `;

    const resultConsulta = await query<Pick<T_Personal_Administrativo, "DNI_Personal_Administrativo" | "Estado" | "Nombres" | "Apellidos">>(
      instanciaEnUso,
      sqlConsulta,
      [dniPersonal]
    );

    // Si no encontramos el personal administrativo, retornamos null
    if (resultConsulta.rows.length === 0) {
      return null;
    }

    const personalActual = resultConsulta.rows[0];
    
    // Determinamos el estado a aplicar (invertimos el actual si no se especifica uno nuevo)
    const estadoFinal = nuevoEstado !== undefined ? nuevoEstado : !personalActual.Estado;

    // Actualizamos el estado del personal administrativo
    const sqlUpdate = `
      UPDATE "T_Personal_Administrativo"
      SET "Estado" = $1
      WHERE "DNI_Personal_Administrativo" = $2
      RETURNING "DNI_Personal_Administrativo", "Nombres", "Apellidos", "Estado"
    `;

    const resultUpdate = await query<Pick<T_Personal_Administrativo, "DNI_Personal_Administrativo" | "Nombres" | "Apellidos" | "Estado">>(
      instanciaEnUso,
      sqlUpdate,
      [estadoFinal, dniPersonal]
    );

    // Retornamos los datos actualizados
    return resultUpdate.rows[0];
  } catch (error) {
    // Capturar y relanzar errores específicos
    if (error instanceof Error) {
      // Relanzamos el error para ser manejado por el controlador
      throw error;
    }
    
    // Error desconocido
    throw new Error(`Error desconocido al cambiar estado de personal administrativo: ${error}`);
  }
}