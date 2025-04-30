// src/core/database/queries/personal-administrativo/personalAdministrativoQueries.ts
import { T_Personal_Administrativo } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Busca un personal administrativo por su nombre de usuario
 * @param nombreUsuario Nombre de usuario del personal administrativo
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del personal administrativo o null si no existe
 */
export async function buscarPersonalAdministrativoPorNombreUsuario(
  nombreUsuario: string,
  instanciaEnUso?: RDP02
): Promise<T_Personal_Administrativo | null> {
  const sql = `
    SELECT *
    FROM "T_Personal_Administrativo"
    WHERE "Nombre_Usuario" = $1
  `;

  // Operación de lectura, sin necesidad de especificar rol
  const result = await query<T_Personal_Administrativo>(
    instanciaEnUso, // instancia específica o automática si es undefined
    sql,
    [nombreUsuario]
    // No especificamos rol, cualquier instancia puede atender esta consulta
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Busca personal administrativo por su nombre de usuario y selecciona campos específicos
 * @param nombreUsuario Nombre de usuario del personal administrativo
 * @param campos Campos específicos a seleccionar (keyof T_Personal_Administrativo)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del personal administrativo o null si no existe
 */
export async function buscarPersonalAdministrativoPorNombreUsuarioSelect<
  K extends keyof T_Personal_Administrativo
>(
  nombreUsuario: string,
  campos: K[],
  instanciaEnUso?: RDP02
): Promise<Pick<T_Personal_Administrativo, K> | null> {
  // Construir la consulta SQL con los campos especificados
  const camposStr = campos.map((campo) => `"${String(campo)}"`).join(", ");

  const sql = `
    SELECT ${camposStr}
    FROM "T_Personal_Administrativo"
    WHERE "Nombre_Usuario" = $1
  `;

  // Operación de lectura, sin necesidad de especificar rol
  const result = await query<Pick<T_Personal_Administrativo, K>>(
    instanciaEnUso, // instancia específica o automática si es undefined
    sql,
    [nombreUsuario]
    // No especificamos rol, cualquier instancia puede atender esta consulta
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

