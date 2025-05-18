import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

// Actualizar contraseña de profesor primaria
export async function actualizarContraseñaProfesorPrimaria(
  dniProfesor: string,
  nuevaContraseña: string,
  instanciaEnUso?: RDP02
): Promise<boolean> {
  const sql = `
      UPDATE "T_Profesores_Primaria"
      SET "Contraseña" = $2
      WHERE "DNI_Profesor_Primaria" = $1
    `;

  const result = await query(instanciaEnUso, sql, [
    dniProfesor,
    nuevaContraseña,
  ]);

  return result.rowCount !== null && result.rowCount > 0;
}
