// core/databases/queries/RDP02/codigos-otp/buscarCodigoOTP.ts
import { T_Codigos_OTP } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Busca un código OTP que coincida con los criterios especificados
 * @param criterios Criterios de búsqueda del código OTP
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del código OTP o null si no existe
 */
export async function buscarCodigoOTP(
  criterios: {
    Codigo: string;
    Correo_Destino: string;
    Rol_Usuario: string;
    Id_Usuario: string;
    Fecha_Expiracion_Min?: number; // Timestamp mínimo para la expiración
  },
  instanciaEnUso?: RDP02
): Promise<T_Codigos_OTP | null> {
  let sql = `
    SELECT * FROM "T_Codigos_OTP" 
    WHERE "Codigo" = $1 
    AND "Correo_Destino" = $2 
    AND "Rol_Usuario" = $3 
    AND "Id_Usuario" = $4
  `;

  const params: (string | number)[] = [
    criterios.Codigo,
    criterios.Correo_Destino,
    criterios.Rol_Usuario,
    criterios.Id_Usuario,
  ];

  // Si se proporciona una fecha de expiración mínima, añadirla a la consulta
  if (criterios.Fecha_Expiracion_Min !== undefined) {
    sql += ` AND "Fecha_Expiracion" >= $5`;
    params.push(criterios.Fecha_Expiracion_Min);
  }

  const result = await query<T_Codigos_OTP>(instanciaEnUso, sql, params);

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}
