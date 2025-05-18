import { T_Directivos } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Busca un directivo por su ID
 * @param idDirectivo ID del directivo
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del directivo o null si no existe
 */
export async function buscarDirectivoPorId(
  idDirectivo: number,
  instanciaEnUso?: RDP02
): Promise<T_Directivos | null> {
  const sql = `
    SELECT *
    FROM "T_Directivos"
    WHERE "Id_Directivo" = $1
  `;

  // Operación de lectura
  const result = await query<T_Directivos>(
    instanciaEnUso, // instancia específica o automática si es undefined
    sql,
    [idDirectivo]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Busca un directivo por su ID y selecciona campos específicos
 * @param idDirectivo ID del directivo
 * @param campos Campos específicos a seleccionar (keyof T_Directivos)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del directivo o null si no existe
 */
export async function buscarDirectivoPorIdSelect<K extends keyof T_Directivos>(
  idDirectivo: number,
  campos: K[],
  instanciaEnUso?: RDP02
): Promise<Pick<T_Directivos, K> | null> {
  // Construir la consulta SQL con los campos especificados
  const camposStr = campos.map((campo) => `"${String(campo)}"`).join(", ");

  const sql = `
    SELECT ${camposStr}
    FROM "T_Directivos"
    WHERE "Id_Directivo" = $1
  `;

  // Operación de lectura
  const result = await query<Pick<T_Directivos, K>>(
    instanciaEnUso, // instancia específica o automática si es undefined
    sql,
    [idDirectivo]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}
