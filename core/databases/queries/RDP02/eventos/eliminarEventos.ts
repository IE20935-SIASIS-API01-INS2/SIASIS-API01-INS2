import { T_Eventos } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Obtiene un evento por su ID
 * @param idEvento ID del evento a buscar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Evento encontrado o null si no existe
 */
export async function buscarEventoPorId(
  idEvento: number,
  instanciaEnUso?: RDP02
): Promise<T_Eventos | null> {
  const sql = `
    SELECT 
      "Id_Evento",
      "Nombre",
      "Fecha_Inicio",
      "Fecha_Conclusion"
    FROM "T_Eventos"
    WHERE "Id_Evento" = $1
  `;

  const params = [idEvento];

  const result = await query<T_Eventos>(instanciaEnUso, sql, params);
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Verifica si un evento puede ser eliminado (debe ser futuro, no activo ni pasado)
 * @param evento Evento a verificar
 * @returns objeto con información sobre si puede eliminarse
 */
export function verificarSiEventoPuedeEliminarse(evento: T_Eventos): {
  puedeEliminarse: boolean;
  razon?: string;
} {
  const fechaActual = new Date();
  const fechaActualSoloFecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
  
  const fechaInicio = new Date(evento.Fecha_Inicio);
  const fechaInicioSoloFecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
  
  const fechaConcusion = new Date(evento.Fecha_Conclusion);
  const fechaConclusionSoloFecha = new Date(fechaConcusion.getFullYear(), fechaConcusion.getMonth(), fechaConcusion.getDate());

  // Si el evento ya comenzó (fecha inicio <= fecha actual)
  if (fechaInicioSoloFecha <= fechaActualSoloFecha) {
    // Si ya terminó
    if (fechaConclusionSoloFecha < fechaActualSoloFecha) {
      return {
        puedeEliminarse: false,
        razon: "No se pueden eliminar eventos que ya han finalizado"
      };
    }
    // Si está activo (comenzó pero no ha terminado)
    else {
      return {
        puedeEliminarse: false,
        razon: "No se pueden eliminar eventos que están actualmente en curso"
      };
    }
  }

  // Si es un evento futuro (fecha inicio > fecha actual)
  return {
    puedeEliminarse: true
  };
}

/**
 * Elimina un evento de la base de datos
 * @param idEvento ID del evento a eliminar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Evento eliminado
 */
export async function eliminarEvento(
  idEvento: number,
  instanciaEnUso?: RDP02
): Promise<T_Eventos> {
  const sql = `
    DELETE FROM "T_Eventos"
    WHERE "Id_Evento" = $1
    RETURNING 
      "Id_Evento",
      "Nombre",
      "Fecha_Inicio",
      "Fecha_Conclusion"
  `;

  const params = [idEvento];

  const result = await query<T_Eventos>(instanciaEnUso, sql, params);



  
  if (result.rows.length === 0) {
    throw new Error("No se pudo eliminar el evento");
  }

  return result.rows[0];
}