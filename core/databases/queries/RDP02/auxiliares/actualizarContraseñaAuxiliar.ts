import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { RolesSistema } from "../../../../../src/interfaces/shared/RolesSistema";
import { query } from "../../../connectors/postgres";

// Actualizar contraseña de auxiliar
export async function actualizarContraseñaAuxiliar(
  dniAuxiliar: string,
  nuevaContraseña: string,
  instanciaEnUso?: RDP02
): Promise<boolean> {
  const sql = `
      UPDATE "T_Auxiliares"
      SET "Contraseña" = $2
      WHERE "DNI_Auxiliar" = $1
    `;

  const result = await query(
    instanciaEnUso,
    sql,
    [dniAuxiliar, nuevaContraseña],
    undefined,
    [RolesSistema.Auxiliar]
  );

  return result.rowCount !== null && result.rowCount > 0;
}
