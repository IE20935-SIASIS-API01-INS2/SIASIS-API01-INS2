import { T_Profesores_Secundaria } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";
import { RolesSistema } from "../../../../../src/interfaces/shared/RolesSistema";

/**
 * Busca un profesor de secundaria por su Id
 * @param idProfesor Id del profesor de secundaria
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del profesor o null si no existe
 */
export async function buscarProfesorSecundariaPorId(
  idProfesor: string,
  instanciaEnUso?: RDP02
): Promise<T_Profesores_Secundaria | null> {
  const sql = `
    SELECT *
    FROM "T_Profesores_Secundaria"
    WHERE "Id_Profesor_Secundaria" = $1
  `;

  // Operación de lectura
  const result = await query<T_Profesores_Secundaria>(
    instanciaEnUso,
    sql,
    [idProfesor],
    RolesSistema.ProfesorSecundaria
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Busca un profesor de secundaria por su Id y selecciona campos específicos
 * @param idProfesor Id del profesor de secundaria
 * @param campos Campos específicos a seleccionar (keyof T_Profesores_Secundaria)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del profesor o null si no existe
 */
export async function buscarProfesorSecundariaPorIdSelect<
  K extends keyof T_Profesores_Secundaria
>(
  idProfesor: string,
  campos: K[],
  instanciaEnUso?: RDP02
): Promise<Pick<T_Profesores_Secundaria, K> | null> {
  // Construir la consulta SQL con los campos especificados
  const camposStr = campos.map((campo) => `"${String(campo)}"`).join(", ");

  const sql = `
    SELECT ${camposStr}
    FROM "T_Profesores_Secundaria"
    WHERE "Id_Profesor_Secundaria" = $1
  `;

  // Operación de lectura
  const result = await query<Pick<T_Profesores_Secundaria, K>>(
    instanciaEnUso,
    sql,
    [idProfesor],
    RolesSistema.ProfesorSecundaria
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}


