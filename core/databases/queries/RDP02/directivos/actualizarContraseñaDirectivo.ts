import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

// Actualizar contraseña de directivo
export async function actualizarContraseñaDirectivo(
  idDirectivo: number,
  nuevaContraseña: string,
  instanciaEnUso: RDP02
): Promise<boolean> {
  const sql = `
      UPDATE "T_Directivos"
      SET "Contraseña" = $2
      WHERE "Id_Directivo" = $1
    `;

  const result = await query(
    instanciaEnUso,
    sql,
    [idDirectivo, nuevaContraseña]
  );

  return result.rowCount !== null && result.rowCount > 0;
}
