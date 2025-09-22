import { T_Personal_Administrativo } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";
import { RolesSistema } from "../../../../../src/interfaces/shared/RolesSistema";

/**
 * Busca un personal administrativo por su ID
 * @param idPersonal ID del personal administrativo
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del personal administrativo o null si no existe
 */
export async function buscarPersonalAdministrativoPorId(
  idPersonal: string,
  instanciaEnUso?: RDP02
): Promise<T_Personal_Administrativo | null> {
  const sql = `
    SELECT *
    FROM "T_Personal_Administrativo"
    WHERE "Id_Personal_Administrativo" = $1
  `;

  // Operación de lectura
  const result = await query<T_Personal_Administrativo>(
    instanciaEnUso,
    sql,
    [idPersonal],
    RolesSistema.PersonalAdministrativo
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Busca un personal administrativo por su ID y selecciona campos específicos
 * @param idPersonal ID del personal administrativo
 * @param campos Campos específicos a seleccionar (keyof T_Personal_Administrativo)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del personal administrativo o null si no existe
 */
export async function buscarPersonalAdministrativoPorIdSelect<
  K extends keyof T_Personal_Administrativo
>(
  idPersonal: string,
  campos: K[],
  instanciaEnUso?: RDP02
): Promise<Pick<T_Personal_Administrativo, K> | null> {
  // Construir la consulta SQL con los campos especificados
  const camposStr = campos.map((campo) => `"${String(campo)}"`).join(", ");

  const sql = `
    SELECT ${camposStr}
    FROM "T_Personal_Administrativo"
    WHERE "Id_Personal_Administrativo" = $1
  `;

  // Operación de lectura
  const result = await query<Pick<T_Personal_Administrativo, K>>(
    instanciaEnUso,
    sql,
    [idPersonal],
    RolesSistema.PersonalAdministrativo
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}
