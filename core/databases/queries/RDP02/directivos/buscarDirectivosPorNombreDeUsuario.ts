import { T_Directivos } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Busca un directivo por su nombre de usuario
 * @param nombreUsuario Nombre de usuario del directivo
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del directivo o null si no existe
 */
export async function buscarDirectivoPorNombreUsuario(
  nombreUsuario: string,
  instanciaEnUso?: RDP02
): Promise<T_Directivos | null> {
  const sql = `
    SELECT *
    FROM "T_Directivos"
    WHERE "Nombre_Usuario" = $1
  `;

  // Operación de lectura, usando rol Directivo
  const result = await query<T_Directivos>(
    instanciaEnUso, // instancia específica o automática si es undefined
    sql,
    [nombreUsuario]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Busca un directivo por su nombre de usuario y selecciona campos específicos
 * @param nombreUsuario Nombre de usuario del directivo
 * @param campos Campos específicos a seleccionar (keyof T_Directivos)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del directivo o null si no existe
 */
export async function buscarDirectivoPorNombreUsuarioSelect<
  K extends keyof T_Directivos
>(
  nombreUsuario: string,
  campos: K[],
  instanciaEnUso?: RDP02
): Promise<Pick<T_Directivos, K> | null> {
  // Construir la consulta SQL con los campos especificados
  const camposStr = campos.map((campo) => `"${String(campo)}"`).join(", ");

  const sql = `
    SELECT ${camposStr}
    FROM "T_Directivos"
    WHERE "Nombre_Usuario" = $1
  `;

  // Operación de lectura
  const result = await query<Pick<T_Directivos, K>>(
    instanciaEnUso, // instancia específica o automática si es undefined
    sql,
    [nombreUsuario]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}
