// core/databases/queries/RDP02/directivos/actualizarDirectivo.ts
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Actualiza los datos de un directivo
 * @param idDirectivo ID del directivo a actualizar
 * @param datos Datos a actualizar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns true si la actualización fue exitosa, false si no se encontró el directivo
 */
export async function actualizarseDirectivo(
  idDirectivo: number,
  datos: {
    Identificador_Nacional?: string;
    Nombres?: string;
    Apellidos?: string;
    Genero?: string;
    Celular?: string;
  },
  instanciaEnUso?: RDP02
): Promise<boolean> {
  // Construir la parte SET de la consulta SQL dinámicamente
  const setClauses = [];
  const params = [];
  let paramIndex = 1;
  
  // Añadir cada campo proporcionado a la cláusula SET
  for (const [key, value] of Object.entries(datos)) {
    setClauses.push(`"${key}" = $${paramIndex}`);
    params.push(value);
    paramIndex++;
  }
  
  // Si no hay campos para actualizar, retornar false
  if (setClauses.length === 0) {
    return false;
  }
  
  // Añadir el identificador al final de los parámetros
  params.push(idDirectivo);
  
  const sql = `
    UPDATE "T_Directivos" 
    SET ${setClauses.join(", ")} 
    WHERE "Id_Directivo" = $${paramIndex}
  `;
  
  const result = await query(
    instanciaEnUso,
    sql,
    params
  );
  
  return result.rowCount !== null && result.rowCount > 0;
}