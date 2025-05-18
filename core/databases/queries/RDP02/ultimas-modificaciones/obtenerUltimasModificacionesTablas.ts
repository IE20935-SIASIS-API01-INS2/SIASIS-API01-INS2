import { T_Ultima_Modificacion_Tablas } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Obtiene las últimas modificaciones de todas las tablas
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Lista de modificaciones de tablas ordenadas por fecha descendente
 */
export async function obtenerUltimasModificacionesTablas(
  instanciaEnUso?: RDP02
): Promise<T_Ultima_Modificacion_Tablas[]> {
  const sql = `
    SELECT 
      "Nombre_Tabla",
      "Operacion" as "Tipo_Modificacion",
      "Fecha_Modificacion",
      "Usuario_Modificacion" as "Detalle_Modificacion",
      "Cantidad_Filas"
    FROM "T_Ultima_Modificacion_Tablas"
    ORDER BY "Fecha_Modificacion" DESC
  `;
  
  const result = await query<T_Ultima_Modificacion_Tablas>(
    instanciaEnUso,
    sql,
    []
  );
  
  return result.rows;
}
