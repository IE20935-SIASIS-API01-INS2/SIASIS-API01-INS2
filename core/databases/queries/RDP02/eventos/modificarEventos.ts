import { T_Eventos } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";
import { EstadoEvento } from "../../../../../src/interfaces/shared/EstadoEventos";

export interface DatosModificacionEvento {
  Nombre?: string;
  Fecha_Inicio?: Date;
  Fecha_Conclusion?: Date;
}

export interface CondicionesEvento {
  Estado: EstadoEvento;
  puedeModificarInicio: boolean;
  puedeModificarConclusión: boolean;
  puedeModificarNombre: boolean;
  razonRestricciones?: string;
}

/**
 * Determina el estado de un evento y qué campos pueden modificarse
 * @param evento Evento a analizar
 * @returns Estado del evento y permisos de modificación
 */
export function determinarEstadoEvento(evento: T_Eventos): CondicionesEvento {
  const fechaActual = new Date();
  const fechaActualSoloFecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
  
  const fechaInicio = new Date(evento.Fecha_Inicio);
  const fechaInicioSoloFecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
  
  const fechaConcusion = new Date(evento.Fecha_Conclusion);
  const fechaConclusionSoloFecha = new Date(fechaConcusion.getFullYear(), fechaConcusion.getMonth(), fechaConcusion.getDate());

  // Evento futuro (no ha comenzado)
  if (fechaInicioSoloFecha > fechaActualSoloFecha) {
    return {
      Estado: EstadoEvento.Pendiente,
      puedeModificarInicio: true,
      puedeModificarConclusión: true,
      puedeModificarNombre: true
    };
  }

  // Evento activo (comenzó pero no ha terminado)
  if (fechaInicioSoloFecha <= fechaActualSoloFecha && fechaConclusionSoloFecha >= fechaActualSoloFecha) {
    return {
      Estado: EstadoEvento.Activo,
      puedeModificarInicio: false,
      puedeModificarConclusión: true,
      puedeModificarNombre: true,
      razonRestricciones: 'No se puede modificar la fecha de inicio de un evento que ya comenzó'
    };
  }

  // Evento pasado (ya terminó)
  return {
    Estado: EstadoEvento.Pasado,
    puedeModificarInicio: false,
    puedeModificarConclusión: false,
    puedeModificarNombre: false,
    razonRestricciones: 'No se pueden modificar eventos que ya han finalizado'
  };
}

/**
 * Valida las modificaciones según el estado del evento
 * @param datosModificacion Datos que se quieren modificar
 * @param estadoEvento Estado actual del evento
 * @returns Resultado de la validación
 */
export function validarModificacionesSegunEstado(
  datosModificacion: DatosModificacionEvento,
  estadoEvento: CondicionesEvento
): { esValido: boolean; mensaje?: string } {
  
  // Si es un evento pasado, no se permite ninguna modificación
  if (estadoEvento.Estado === EstadoEvento.Pasado) {
    return {
      esValido: false,
      mensaje: estadoEvento.razonRestricciones
    };
  }

  // Si es un evento activo y se intenta modificar la fecha de inicio
  if (estadoEvento.Estado === EstadoEvento.Activo && datosModificacion.Fecha_Inicio) {
    return {
      esValido: false,
      mensaje: estadoEvento.razonRestricciones
    };
  }

  return { esValido: true };
}

/**
 * Modifica un evento en la base de datos
 * @param idEvento ID del evento a modificar
 * @param datosModificacion Datos a modificar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Evento modificado
 */
export async function modificarEvento(
  idEvento: number,
  datosModificacion: DatosModificacionEvento,
  instanciaEnUso?: RDP02
): Promise<T_Eventos> {
  
  // Construir la consulta UPDATE dinámicamente
  const camposAModificar: string[] = [];
  const valores: any[] = [];
  let paramIndex = 1;

  if (datosModificacion.Nombre !== undefined) {
    camposAModificar.push(`"Nombre" = $${paramIndex}`);
    valores.push(datosModificacion.Nombre.trim());
    paramIndex++;
  }

  if (datosModificacion.Fecha_Inicio !== undefined) {
    camposAModificar.push(`"Fecha_Inicio" = $${paramIndex}`);
    valores.push(datosModificacion.Fecha_Inicio);
    paramIndex++;
  }

  if (datosModificacion.Fecha_Conclusion !== undefined) {
    camposAModificar.push(`"Fecha_Conclusion" = $${paramIndex}`);
    valores.push(datosModificacion.Fecha_Conclusion);
    paramIndex++;
  }

  if (camposAModificar.length === 0) {
    throw new Error("No hay campos para modificar");
  }

  // Agregar el ID del evento al final de los parámetros
  valores.push(idEvento);

  const sql = `
    UPDATE "T_Eventos"
    SET ${camposAModificar.join(', ')}
    WHERE "Id_Evento" = $${paramIndex}
    RETURNING 
      "Id_Evento",
      "Nombre",
      "Fecha_Inicio",
      "Fecha_Conclusion"
  `;

  const result = await query<T_Eventos>(instanciaEnUso, sql, valores);
  
  if (result.rows.length === 0) {
    throw new Error("No se pudo modificar el evento");
  }

  return result.rows[0];
}

/**
 * Verifica conflicto de fechas exactas excluyendo el evento actual
 * @param fechaInicio Nueva fecha de inicio
 * @param fechaConcusion Nueva fecha de conclusión
 * @param idEventoExcluir ID del evento que se está modificando (para excluirlo de la búsqueda)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns true si existe conflicto, false si no hay conflicto
 */
export async function verificarConflictoFechasExactasModificacion(
  fechaInicio: Date,
  fechaConcusion: Date,
  idEventoExcluir: number,
  instanciaEnUso?: RDP02
): Promise<boolean> {
  const sql = `
    SELECT COUNT(*) as total
    FROM "T_Eventos"
    WHERE "Fecha_Inicio" = $1 
      AND "Fecha_Conclusion" = $2 
      AND "Id_Evento" != $3
  `;

  const params = [fechaInicio, fechaConcusion, idEventoExcluir];

  const result = await query<{ total: string }>(instanciaEnUso, sql, params);
  const total = parseInt(result.rows[0].total);

  return total > 0;
}