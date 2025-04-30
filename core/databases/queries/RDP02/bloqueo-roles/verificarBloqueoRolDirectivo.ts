import { T_Bloqueo_Roles } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";
import { RolesSistema } from "../../../../../src/interfaces/shared/RolesSistema";

/**
 * Verifica si existe un bloqueo para el rol directivo
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Información del bloqueo o null si no existe
 */
export async function verificarBloqueoRolDirectivo(
  instanciaEnUso?: RDP02
): Promise<T_Bloqueo_Roles | null> {
  const sql = `
    SELECT *
    FROM "T_Bloqueo_Roles"
    WHERE "Rol" = $1 AND "Bloqueo_Total" = true
  `;

  // Operación de lectura
  const result = await query<T_Bloqueo_Roles>(
    instanciaEnUso, // instancia específica o automática si es undefined
    sql,
    [RolesSistema.Directivo]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}
