// core/databases/queries/RDP02/codigos-otp/crearCodigoOTP.ts
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Crea un nuevo código OTP en la base de datos
 * @param data Datos del código OTP a crear
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns ID del código OTP creado
 */
export async function crearCodigoOTP(
  data: {
    Codigo: string;
    Fecha_Creacion: number;
    Fecha_Expiracion: number;
    Correo_Destino: string;
    Rol_Usuario: string;
    Id_Usuario: string;
  },
  instanciaEnUso?: RDP02
): Promise<number> {
  const sql = `
    INSERT INTO "T_Codigos_OTP" (
      "Codigo", 
      "Fecha_Creacion", 
      "Fecha_Expiracion", 
      "Correo_Destino", 
      "Rol_Usuario", 
      "Id_Usuario"
    ) 
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING "Id_Codigo_OTP"
  `;

  const result = await query<{ Id_Codigo_OTP: number }>(instanciaEnUso, sql, [
    data.Codigo,
    data.Fecha_Creacion,
    data.Fecha_Expiracion,
    data.Correo_Destino,
    data.Rol_Usuario,
    data.Id_Usuario,
  ]);

  return result.rows[0].Id_Codigo_OTP;
}
