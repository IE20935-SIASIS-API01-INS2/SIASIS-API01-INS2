import { T_Eventos } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

export interface BuscarEventosResult {
  eventos: T_Eventos[];
  total: number;
}

export interface BuscarEventosOptions {
  mes?: number;
  año?: number;
  limit?: number;
  offset?: number;
}

/**
 * Función unificada para buscar eventos con diferentes criterios
 * @param options Opciones de búsqueda (mes, año, limit, offset)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Objeto con eventos encontrados y total de resultados
 */
export async function buscarEventos(
  options: BuscarEventosOptions = {},
  instanciaEnUso?: RDP02
): Promise<BuscarEventosResult> {
  const { mes, año, limit = 10, offset = 0 } = options;

  let whereClause = "";
  let orderByClause = 'ORDER BY "Fecha_Inicio" ASC';
  let params: any[] = [];
  let countParams: any[] = [];
  let paramIndex = 1;

  // Si se especifica mes, construir filtro por mes/año
  if (mes !== undefined) {
    const añoConsulta = año || new Date().getFullYear();
    
    // Crear fechas de inicio y fin del mes para la consulta
    const inicioMes = `${añoConsulta}-${mes.toString().padStart(2, "0")}-01`;
    const ultimoDiaMes = new Date(añoConsulta, mes, 0).getDate();
    const finMes = `${añoConsulta}-${mes
      .toString()
      .padStart(2, "0")}-${ultimoDiaMes.toString().padStart(2, "0")}`;

    // Construir WHERE clause con índices dinámicos
    const mesParam = paramIndex++;      // $1
    const añoParam = paramIndex++;      // $2  
    const inicioMesParam = paramIndex++; // $3
    const finMesParam = paramIndex++;   // $4

    whereClause = `
      WHERE (
        -- Eventos que inician en el mes consultado
        (EXTRACT(MONTH FROM "Fecha_Inicio") = $${mesParam} AND EXTRACT(YEAR FROM "Fecha_Inicio") = $${añoParam})
        OR
        -- Eventos que terminan en el mes consultado
        (EXTRACT(MONTH FROM "Fecha_Conclusion") = $${mesParam} AND EXTRACT(YEAR FROM "Fecha_Conclusion") = $${añoParam})
        OR
        -- Eventos que abarcan todo el mes (inician antes y terminan después)
        (
          "Fecha_Inicio" <= DATE($${inicioMesParam}) AND "Fecha_Conclusion" >= DATE($${finMesParam})
        )
      )
    `;
    
    // Agregar parámetros para WHERE
    params.push(mes, añoConsulta, inicioMes, finMes);
    countParams = [...params]; // Copia para el count
  }

  // Agregar LIMIT y OFFSET con índices dinámicos
  const limitParam = paramIndex++;  
  const offsetParam = paramIndex++;
  const limitClause = `LIMIT $${limitParam} OFFSET $${offsetParam}`;
  
  // Agregar limit y offset solo a la consulta principal (no al count)
  params.push(limit, offset);

  // Consulta principal para obtener eventos
  const sqlEventos = `
    SELECT 
      "Id_Evento",
      "Nombre",
      "Fecha_Inicio",
      "Fecha_Conclusion"
    FROM "T_Eventos"
    ${whereClause}
    ${orderByClause}
    ${limitClause}
  `;

  // Consulta para contar total de eventos
  const sqlCount = `
    SELECT COUNT(*) as total
    FROM "T_Eventos"
    ${whereClause}
  `;

  // Ejecutar ambas consultas
  const [eventosResult, countResult] = await Promise.all([
    query<T_Eventos>(instanciaEnUso, sqlEventos, params),
    query<{ total: string }>(instanciaEnUso, sqlCount, countParams)
  ]);

  const eventos = eventosResult.rows;
  const total = parseInt(countResult.rows[0].total);

  return {
    eventos,
    total
  };
}

// Mantener función original para retrocompatibilidad (si es necesaria en otros lugares)
export async function buscarEventosPorMes(
  mes: number,
  año?: number,
  instanciaEnUso?: RDP02
): Promise<T_Eventos[]> {
  const result = await buscarEventos({ mes, año }, instanciaEnUso);
  return result.eventos;
}

// Mantener función original para retrocompatibilidad (si es necesaria en otros lugares)
export async function buscarEventosAntiguos(
  limit: number = 10,
  instanciaEnUso?: RDP02
): Promise<T_Eventos[]> {
  const result = await buscarEventos({ limit }, instanciaEnUso);
  return result.eventos;
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