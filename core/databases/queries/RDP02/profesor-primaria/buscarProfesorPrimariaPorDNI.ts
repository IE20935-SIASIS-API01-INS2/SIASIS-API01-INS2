import { T_Profesores_Primaria } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";
import { RolesSistema } from "../../../../../src/interfaces/shared/RolesSistema";

/**
 * Busca un profesor de primaria por su DNI
 * @param dniProfesor DNI del profesor de primaria
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del profesor o null si no existe
 */
export async function buscarProfesorPrimariaPorDNI(
  dniProfesor: string,
  instanciaEnUso?: RDP02
): Promise<T_Profesores_Primaria | null> {
  const sql = `
    SELECT *
    FROM "T_Profesores_Primaria"
    WHERE "DNI_Profesor_Primaria" = $1
  `;

  // Operación de lectura
  const result = await query<T_Profesores_Primaria>(
    instanciaEnUso,
    sql,
    [dniProfesor],
    RolesSistema.ProfesorPrimaria
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Busca un profesor de primaria por su DNI y selecciona campos específicos
 * @param dniProfesor DNI del profesor de primaria
 * @param campos Campos específicos a seleccionar (keyof T_Profesores_Primaria)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del profesor o null si no existe
 */
export async function buscarProfesorPrimariaPorDNISelect<
  K extends keyof T_Profesores_Primaria
>(
  dniProfesor: string,
  campos: K[],
  instanciaEnUso?: RDP02
): Promise<Pick<T_Profesores_Primaria, K> | null> {
  // Construir la consulta SQL con los campos especificados
  const camposStr = campos.map((campo) => `"${String(campo)}"`).join(", ");

  const sql = `
    SELECT ${camposStr}
    FROM "T_Profesores_Primaria"
    WHERE "DNI_Profesor_Primaria" = $1
  `;

  // Operación de lectura
  const result = await query<Pick<T_Profesores_Primaria, K>>(
    instanciaEnUso,
    sql,
    [dniProfesor],
    RolesSistema.ProfesorPrimaria
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}
