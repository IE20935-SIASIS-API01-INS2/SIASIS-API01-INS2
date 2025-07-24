import { T_Vacaciones_Interescolares } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

export async function obtenerVacacionesInterescolares(
  instanciaEnUso?: RDP02
): Promise<
  Pick<
    T_Vacaciones_Interescolares,
    "Id_Vacacion_Interescolar" | "Fecha_Inicio" | "Fecha_Conclusion" 
  >[]
> {
  const sql = `
    SELECT 
      "Id_Vacacion_Interescolar", 
      "Fecha_Inicio", 
      "Fecha_Conclusion"
    FROM "T_Vacaciones_Interescolares"
    ORDER BY "Fecha_Inicio" DESC
  `;

  const result = await query<
    Pick<
      T_Vacaciones_Interescolares,
      "Id_Vacacion_Interescolar" | "Fecha_Inicio" | "Fecha_Conclusion" 
    >
  >(instanciaEnUso, sql, []);

  return result.rows;
}

export async function obtenerVacacionesPorMes(
  anio: number,
  mes: number,
  instanciaEnUso?: RDP02
): Promise<
  Pick<T_Vacaciones_Interescolares, "Id_Vacacion_Interescolar" | "Fecha_Inicio" | "Fecha_Conclusion">[]
> {
  const sql = `
    SELECT 
      "Id_Vacacion_Interescolar",
      "Fecha_Inicio",
      "Fecha_Conclusion"
    FROM "T_Vacaciones_Interescolares"
    WHERE 
      EXTRACT(YEAR FROM "Fecha_Inicio") = $1 
      AND EXTRACT(MONTH FROM "Fecha_Inicio") <= $2 
      AND EXTRACT(MONTH FROM "Fecha_Conclusion") >= $2
    ORDER BY "Fecha_Inicio" DESC
  `;

  const result = await query<
    Pick<T_Vacaciones_Interescolares, "Id_Vacacion_Interescolar" | "Fecha_Inicio" | "Fecha_Conclusion">
  >(instanciaEnUso, sql, [anio, mes]);

  return result.rows;
}

export function verificarSolapamientoConVacaciones(
  nuevaFechaInicio: Date,
  nuevaFechaConclusion: Date,
  vacacionesExistentes: Pick<T_Vacaciones_Interescolares, "Id_Vacacion_Interescolar" | "Fecha_Inicio" | "Fecha_Conclusion">[],
  idAExcluir?: number
): T_Vacaciones_Interescolares | null {
  for (const vacacion of vacacionesExistentes) {
    if (idAExcluir && vacacion.Id_Vacacion_Interescolar === idAExcluir) {
      continue;
    }

    const inicio = new Date(vacacion.Fecha_Inicio);
    const fin = new Date(vacacion.Fecha_Conclusion);

    const seSolapan =
      (nuevaFechaInicio >= inicio && nuevaFechaInicio <= fin) ||
      (nuevaFechaConclusion >= inicio && nuevaFechaConclusion <= fin) ||
      (nuevaFechaInicio <= inicio && nuevaFechaConclusion >= fin);

    if (seSolapan) {
      return vacacion;
    }
  }

  return null;
}

