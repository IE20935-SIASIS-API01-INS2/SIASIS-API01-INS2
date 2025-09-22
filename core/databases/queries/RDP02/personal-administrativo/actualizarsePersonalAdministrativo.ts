import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Actualiza los datos de un miembro del personal administrativo
 * @param idPersonal ID del personal administrativo a actualizar
 * @param datos Datos a actualizar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns true si la actualización fue exitosa, false si no se encontró al personal
 */
export async function actualizarsePersonalAdministrativo(
  idPersonal: string,
  datos: {
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
  params.push(idPersonal);

  const sql = `
    UPDATE "T_Personal_Administrativo" 
    SET ${setClauses.join(", ")} 
    WHERE "Id_Personal_Administrativo" = $${paramIndex}
  `;

  const result = await query(instanciaEnUso, sql, params);

  return result.rowCount !== null && result.rowCount > 0;
}
