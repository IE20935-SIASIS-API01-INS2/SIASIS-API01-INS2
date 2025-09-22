import { T_Eventos } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

export interface DatosEvento {
  Nombre: string;
  Fecha_Inicio: Date;
  Fecha_Conclusion: Date;
}

/**
 * Registra un nuevo evento en la base de datos
 * @param datosEvento Datos del evento a registrar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Evento registrado con su ID generado automáticamente
 */
export async function registrarEvento(
  datosEvento: DatosEvento,
  instanciaEnUso?: RDP02
): Promise<T_Eventos> {
  const sql = `
    INSERT INTO "T_Eventos" (
      "Nombre",
      "Fecha_Inicio", 
      "Fecha_Conclusion"
    )
    VALUES ($1, $2, $3)
    RETURNING 
      "Id_Evento",
      "Nombre",
      "Fecha_Inicio",
      "Fecha_Conclusion"
  `;

  const params = [
    datosEvento.Nombre,
    datosEvento.Fecha_Inicio,
    datosEvento.Fecha_Conclusion
  ];

  const result = await query<T_Eventos>(instanciaEnUso, sql, params);
  
  if (result.rows.length === 0) {
    throw new Error("No se pudo registrar el evento");
  }

  return result.rows[0];
}

/**
 * Verifica si existe conflicto de fechas exactas con otros eventos
 * @param fechaInicio Fecha de inicio del nuevo evento
 * @param fechaConcusion Fecha de conclusión del nuevo evento
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns true si existe conflicto, false si no hay conflicto
 */
export async function verificarConflictoFechasExactas(
  fechaInicio: Date,
  fechaConcusion: Date,
  instanciaEnUso?: RDP02
): Promise<boolean> {
  const sql = `
    SELECT COUNT(*) as total
    FROM "T_Eventos"
    WHERE "Fecha_Inicio" = $1 AND "Fecha_Conclusion" = $2
  `;

  const params = [fechaInicio, fechaConcusion];

  const result = await query<{ total: string }>(instanciaEnUso, sql, params);
  const total = parseInt(result.rows[0].total);

  return total > 0;
}