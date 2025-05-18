// core/databases/queries/RDP02/auxiliares/verificarExistenciaAuxiliar.ts
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Verifica si existe un auxiliar con el DNI especificado
 * @param dniAuxiliar DNI del auxiliar a verificar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns true si existe, false si no
 */
export async function verificarExistenciaAuxiliar(
  dniAuxiliar: string,
  instanciaEnUso?: RDP02
): Promise<boolean> {
  const sql = `
    SELECT 1 FROM "T_Auxiliares" 
    WHERE "DNI_Auxiliar" = $1
  `;

  const result = await query(instanciaEnUso, sql, [dniAuxiliar]);

  return result.rows.length > 0;
}
