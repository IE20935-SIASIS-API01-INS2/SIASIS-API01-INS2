import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

// Actualizar contraseña de personal administrativo
export async function actualizarContraseñaPersonalAdministrativo(
  dniPersonal: string,
  nuevaContraseña: string,
  instanciaEnUso?: RDP02
): Promise<boolean> {
  const sql = `
      UPDATE "T_Personal_Administrativo"
      SET "Contraseña" = $2
      WHERE "DNI_Personal_Administrativo" = $1
    `;

  const result = await query(instanciaEnUso, sql, [
    dniPersonal,
    nuevaContraseña,
  ]);

  return result.rowCount !== null && result.rowCount > 0;
}
