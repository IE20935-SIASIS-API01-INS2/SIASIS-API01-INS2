import { T_Eventos } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Busca eventos que ocurren en un mes específico
 * @param mes Mes a consultar (1-12)
 * @param año Año a consultar (opcional, por defecto año actual)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Array de eventos que ocurren en el mes especificado
 */
export async function buscarEventosPorMes(
  mes: number,
  año?: number,
  instanciaEnUso?: RDP02
): Promise<T_Eventos[]> {
  const añoConsulta = año || new Date().getFullYear();

  const sql = `
    SELECT 
      "Id_Evento",
      "Nombre",
      "Fecha_Inicio",
      "Fecha_Conclusion"
    FROM "T_Eventos"
    WHERE (
      -- Eventos que inician en el mes consultado
      (EXTRACT(MONTH FROM "Fecha_Inicio") = $1 AND EXTRACT(YEAR FROM "Fecha_Inicio") = $2)
      OR
      -- Eventos que terminan en el mes consultado
      (EXTRACT(MONTH FROM "Fecha_Conclusion") = $1 AND EXTRACT(YEAR FROM "Fecha_Conclusion") = $2)
      OR
      -- Eventos que abarcan todo el mes (inician antes y terminan después)
      (
        "Fecha_Inicio" <= $3::date AND "Fecha_Conclusion" >= $4::date
      )
    )
    ORDER BY "Fecha_Inicio" ASC
  `;

  // Crear fechas de inicio y fin del mes para la consulta
  const inicioMes = `${añoConsulta}-${mes.toString().padStart(2, "0")}-01`;
  const ultimoDiaMes = new Date(añoConsulta, mes, 0).getDate();
  const finMes = `${añoConsulta}-${mes
    .toString()
    .padStart(2, "0")}-${ultimoDiaMes.toString().padStart(2, "0")}`;

  const result = await query<T_Eventos>(instanciaEnUso, sql, [
    mes,
    añoConsulta,
    inicioMes,
    finMes,
  ]);

  return result.rows;
}

export function verificarConflictoConEventos(
    fechaInicio: Date,
    fechaFin: Date,
    eventos: T_Eventos[]
): T_Eventos[] {
    return eventos.filter(evento => {
        const inicioEvento = new Date(evento.Fecha_Inicio);
        const finEvento = new Date(evento.Fecha_Conclusion);

        return (
            (inicioEvento <= fechaFin && finEvento >= fechaInicio) // Cualquier traslape
        );
    });
}
