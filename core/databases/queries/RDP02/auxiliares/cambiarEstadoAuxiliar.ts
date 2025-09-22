// core/databases/queries/RDP02/auxiliares/cambiarEstadoAuxiliar.ts
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";
import { T_Auxiliares } from "@prisma/client";

/**
 * Cambia el estado (activo/inactivo) de un auxiliar
 * @param idAuxiliar ID del auxiliar a modificar
 * @param nuevoEstado Nuevo estado (opcional). Si no se proporciona, invierte el estado actual
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos actualizados del auxiliar o null si no se encuentra
 */
export async function cambiarEstadoAuxiliar(
  idAuxiliar: string,
  nuevoEstado?: boolean,
  instanciaEnUso?: RDP02
): Promise<Pick<
  T_Auxiliares,
  "Id_Auxiliar" | "Nombres" | "Apellidos" | "Estado"
> | null> {
  try {
    // Primero, verificamos si el auxiliar existe y obtenemos su estado actual
    const sqlConsulta = `
      SELECT "Id_Auxiliar", "Estado", "Nombres", "Apellidos"
      FROM "T_Auxiliares"
      WHERE "Id_Auxiliar" = $1
    `;

    const resultConsulta = await query<
      Pick<T_Auxiliares, "Id_Auxiliar" | "Estado" | "Nombres" | "Apellidos">
    >(instanciaEnUso, sqlConsulta, [idAuxiliar]);

    // Si no encontramos el auxiliar, retornamos null
    if (resultConsulta.rows.length === 0) {
      return null;
    }

    const auxiliarActual = resultConsulta.rows[0];

    // Determinamos el estado a aplicar (invertimos el actual si no se especifica uno nuevo)
    const estadoFinal =
      nuevoEstado !== undefined ? nuevoEstado : !auxiliarActual.Estado;

    // Actualizamos el estado del auxiliar
    const sqlUpdate = `
      UPDATE "T_Auxiliares"
      SET "Estado" = $1
      WHERE "Id_Auxiliar" = $2
      RETURNING "Id_Auxiliar", "Nombres", "Apellidos", "Estado"
    `;

    const resultUpdate = await query<
      Pick<T_Auxiliares, "Id_Auxiliar" | "Nombres" | "Apellidos" | "Estado">
    >(instanciaEnUso, sqlUpdate, [estadoFinal, idAuxiliar]);

    // Retornamos los datos actualizados
    return resultUpdate.rows[0];
  } catch (error) {
    // Capturar y relanzar errores específicos
    if (error instanceof Error) {
      // Relanzamos el error para ser manejado por el controlador
      throw error;
    }

    // Error desconocido
    throw new Error(
      `Error desconocido al cambiar estado de auxiliar: ${error}`
    );
  }
}
