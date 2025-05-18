import { T_Responsables } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";
import { RolesSistema } from "../../../../../src/interfaces/shared/RolesSistema";

/**
 * Busca un responsable por su DNI
 * @param dniResponsable DNI del responsable
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del responsable o null si no existe
 */
export async function buscarResponsablePorDNI(
  dniResponsable: string,
  instanciaEnUso?: RDP02
): Promise<T_Responsables | null> {
  const sql = `
    SELECT *
    FROM "T_Responsables"
    WHERE "DNI_Responsable" = $1
  `;

  // Operación de lectura
  const result = await query<T_Responsables>(
    instanciaEnUso,
    sql,
    [dniResponsable],
    RolesSistema.Responsable
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Busca un responsable por su DNI y selecciona campos específicos
 * @param dniResponsable DNI del responsable
 * @param campos Campos específicos a seleccionar (keyof T_Responsables)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del responsable o null si no existe
 */
export async function buscarResponsablePorDNISelect<
  K extends keyof T_Responsables
>(
  dniResponsable: string,
  campos: K[],
  instanciaEnUso?: RDP02
): Promise<Pick<T_Responsables, K> | null> {
  // Construir la consulta SQL con los campos especificados
  const camposStr = campos.map((campo) => `"${String(campo)}"`).join(", ");

  const sql = `
    SELECT ${camposStr}
    FROM "T_Responsables"
    WHERE "DNI_Responsable" = $1
  `;

  // Operación de lectura
  const result = await query<Pick<T_Responsables, K>>(
    instanciaEnUso,
    sql,
    [dniResponsable],
    RolesSistema.Responsable
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Verifica si un responsable tiene estudiantes activos asociados
 * @param dniResponsable DNI del responsable
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns true si tiene al menos un estudiante activo, false en caso contrario
 */
export async function verificarEstudiantesActivosResponsable(
  dniResponsable: string,
  instanciaEnUso?: RDP02
): Promise<boolean> {
  const sql = `
    SELECT EXISTS (
      SELECT 1
      FROM "T_Relaciones_E_R" r
      JOIN "T_Estudiantes" e ON r."DNI_Estudiante" = e."DNI_Estudiante"
      WHERE r."DNI_Responsable" = $1
      AND e."Estado" = true
    ) as tiene_estudiantes_activos
  `;

  // Operación de lectura
  const result = await query<{ tiene_estudiantes_activos: boolean }>(
    instanciaEnUso,
    sql,
    [dniResponsable],
    RolesSistema.Responsable
  );

  if (result.rows.length > 0) {
    return result.rows[0].tiene_estudiantes_activos;
  }

  return false;
}
