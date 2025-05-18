import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

// Actualizar contraseña de responsable
export async function actualizarContraseñaResponsable(
    dniResponsable: string,
    nuevaContraseña: string,
    instanciaEnUso?: RDP02
  ): Promise<boolean> {
    const sql = `
        UPDATE "T_Responsables"
        SET "Contraseña" = $2
        WHERE "DNI_Responsable" = $1
      `;
  
    const result = await query(
      instanciaEnUso,
      sql,
      [dniResponsable, nuevaContraseña],

    );
  
    return result.rowCount! > 0;
  }
  