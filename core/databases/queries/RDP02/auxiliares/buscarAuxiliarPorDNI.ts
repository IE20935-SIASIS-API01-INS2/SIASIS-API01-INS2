import { T_Auxiliares } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";
import { RolesSistema } from "../../../../../src/interfaces/shared/RolesSistema";

/**
 * Busca un auxiliar por su DNI
 * @param dniAuxiliar DNI del auxiliar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del auxiliar o null si no existe
 */
export async function buscarAuxiliarPorDNI(
  dniAuxiliar: string,
  instanciaEnUso?: RDP02
): Promise<T_Auxiliares | null> {
  const sql = `
    SELECT *
    FROM "T_Auxiliares"
    WHERE "DNI_Auxiliar" = $1
  `;

  // Operación de lectura
  const result = await query<T_Auxiliares>(
    instanciaEnUso,
    sql,
    [dniAuxiliar],
    RolesSistema.Auxiliar
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Busca un auxiliar por su DNI y selecciona campos específicos
 * @param dniAuxiliar DNI del auxiliar
 * @param campos Campos específicos a seleccionar (keyof T_Auxiliares)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del auxiliar o null si no existe
 */
export async function buscarAuxiliarPorDNISelect<K extends keyof T_Auxiliares>(
  dniAuxiliar: string,
  campos: K[],
  instanciaEnUso?: RDP02
): Promise<Pick<T_Auxiliares, K> | null> {
  // Construir la consulta SQL con los campos especificados
  const camposStr = campos.map((campo) => `"${String(campo)}"`).join(", ");

  const sql = `
    SELECT ${camposStr}
    FROM "T_Auxiliares"
    WHERE "DNI_Auxiliar" = $1
  `;

  // Operación de lectura
  const result = await query<Pick<T_Auxiliares, K>>(
    instanciaEnUso,
    sql,
    [dniAuxiliar],
    RolesSistema.Auxiliar
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}
