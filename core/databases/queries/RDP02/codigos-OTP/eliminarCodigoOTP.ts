// core/databases/queries/RDP02/codigos-otp/eliminarCodigoOTP.ts
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Elimina un código OTP de la base de datos
 * @param idCodigoOTP ID del código OTP a eliminar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns true si la eliminación fue exitosa
 */
export async function eliminarCodigoOTP(
  idCodigoOTP: number,
  instanciaEnUso: RDP02
): Promise<boolean> {
  const sql = `
    DELETE FROM "T_Codigos_OTP" 
    WHERE "Id_Codigo_OTP" = $1
  `;

  const result = await query(instanciaEnUso, sql, [idCodigoOTP]);

  return result.rowCount !== null && result.rowCount > 0;
}
