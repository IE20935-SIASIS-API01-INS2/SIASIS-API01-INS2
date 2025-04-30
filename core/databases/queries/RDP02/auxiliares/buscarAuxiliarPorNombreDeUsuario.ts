// src/core/database/queries/auxiliares/auxiliarQueries.ts
import { T_Auxiliares } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Busca un auxiliar por su nombre de usuario
 * @param nombreUsuario Nombre de usuario del auxiliar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del auxiliar o null si no existe
 */
export async function buscarAuxiliarPorNombreUsuario(
  nombreUsuario: string,
  instanciaEnUso?: RDP02
): Promise<T_Auxiliares | null> {
  const sql = `
    SELECT *
    FROM "T_Auxiliares"
    WHERE "Nombre_Usuario" = $1
  `;

  // Operación de lectura, usando rol Auxiliar
  const result = await query<T_Auxiliares>(
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
 * Busca un auxiliar por su nombre de usuario y selecciona campos específicos
 * @param nombreUsuario Nombre de usuario del auxiliar
 * @param campos Campos específicos a seleccionar (keyof T_Auxiliares)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del auxiliar o null si no existe
 */
export async function buscarAuxiliarPorNombreUsuarioSelect<
  K extends keyof T_Auxiliares
>(
  nombreUsuario: string,
  campos: K[],
  instanciaEnUso?: RDP02
): Promise<Pick<T_Auxiliares, K> | null> {
  // Construir la consulta SQL con los campos especificados
  const camposStr = campos.map((campo) => `"${String(campo)}"`).join(", ");

  const sql = `
    SELECT ${camposStr}
    FROM "T_Auxiliares"
    WHERE "Nombre_Usuario" = $1
  `;

  // Operación de lectura
  const result = await query<Pick<T_Auxiliares, K>>(
    instanciaEnUso, // instancia específica o automática si es undefined
    sql,
    [nombreUsuario]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}
