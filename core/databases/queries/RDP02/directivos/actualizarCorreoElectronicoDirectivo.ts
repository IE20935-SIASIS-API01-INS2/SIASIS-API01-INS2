// core/databases/queries/RDP02/directivos/actualizarCorreoDirectivo.ts
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Actualiza el correo electrónico de un directivo
 * @param idDirectivo ID del directivo a actualizar
 * @param nuevoCorreo Nuevo correo electrónico
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns true si la actualización fue exitosa
 */
export async function actualizarCorreoDirectivo(
  idDirectivo: number,
  nuevoCorreo: string,
  instanciaEnUso: RDP02
): Promise<boolean> {
  const sql = `
    UPDATE "T_Directivos" 
    SET "Correo_Electronico" = $1 
    WHERE "Id_Directivo" = $2
  `;
  
  const result = await query(
    instanciaEnUso,
    sql,
    [nuevoCorreo, idDirectivo]
  );
  
  return result.rowCount !== null && result.rowCount > 0;
}