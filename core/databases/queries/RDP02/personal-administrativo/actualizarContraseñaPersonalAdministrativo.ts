import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

// Actualizar contraseña de personal administrativo
export async function actualizarContraseñaPersonalAdministrativo(
  idPersonal: string,
  nuevaContraseña: string,
  instanciaEnUso?: RDP02
): Promise<boolean> {
  const sql = `
      UPDATE "T_Personal_Administrativo"
      SET "Contraseña" = $2
      WHERE "Id_Personal_Administrativo" = $1
    `;

  const result = await query(instanciaEnUso, sql, [
    idPersonal,
    nuevaContraseña,
  ]);

  return result.rowCount !== null && result.rowCount > 0;
}
