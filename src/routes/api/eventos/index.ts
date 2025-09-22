import { Request, Response, Router } from "express";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";
import {
  RequestErrorTypes,
  SystemErrorTypes,
} from "../../../interfaces/shared/errors";

import { buscarEventos } from "../../../../core/databases/queries/RDP02/eventos/buscarEventos";
import isDirectivoAuthenticated from "../../../middlewares/isDirectivoAuthenticated";
import isProfesorPrimariaAuthenticated from "../../../middlewares/isProfesorPrimariaAuthenticated";
import isProfesorSecundariaAuthenticated from "../../../middlewares/isProfesorSecundariaAuthenticated";
import isTutorAuthenticated from "../../../middlewares/isTutorAuthenticated";
import isAuxiliarAuthenticated from "../../../middlewares/isAuxiliarAuthenticated";
import isPersonalAdministrativoAuthenticated from "../../../middlewares/isPersonalAdministrativoAuthenticated";
import checkAuthentication from "../../../middlewares/checkAuthentication";
import { BuscarEventosParams, EliminarEventoSuccessResponse, GetEventosSuccessResponse, ModificarEventoRequestBody, ModificarEventoSuccessResponse, RegistrarEventoRequesBody, RegistrarEventoSuccessResponse } from "../../../interfaces/shared/apis/eventos/types";
import { registrarEvento, verificarConflictoFechasExactas } from "../../../../core/databases/queries/RDP02/eventos/registrarEvento";
import { buscarEventoPorId, eliminarEvento, verificarSiEventoPuedeEliminarse } from "../../../../core/databases/queries/RDP02/eventos/eliminarEventos";
import { DatosModificacionEvento, determinarEstadoEvento, modificarEvento, verificarConflictoFechasExactasModificacion } from "../../../../core/databases/queries/RDP02/eventos/modificarEventos";
import { EstadoEvento } from "../../../interfaces/shared/EstadoEventos";
import { consultarConEMCN01 } from "../../../../core/external/github/EMCN01/consultarConEMCN01";
import {  transformarElementoParaRegistrarEnRDP03 } from "../../../interfaces/shared/RDP03/RDP03_Tablas";
import { RDP03 } from "../../../interfaces/shared/RDP03Instancias";

const EventosRouter = Router();

const MAXIMA_CANTIDAD_EVENTOS = 10;


// Ruta para obtener eventos con paginación y filtrado por mes y año
EventosRouter.get(
  "/",
  isDirectivoAuthenticated,
  isProfesorPrimariaAuthenticated,
  isAuxiliarAuthenticated,
  isProfesorSecundariaAuthenticated,
  isTutorAuthenticated,
  isPersonalAdministrativoAuthenticated,
  checkAuthentication as any,
  (async (req: Request, res: Response) => {
    try {
      const { Mes, Año, Limit, Offset } = req.query as BuscarEventosParams;
      const rdp02EnUso = req.RDP02_INSTANCE!;
      console.log("Parámetros recibidos:", { Mes, Año, Limit, Offset });

      // Parsear parámetros opcionales
      const limit = Limit ? Number(Limit) : 10;
      const offset = Offset ? Number(Offset) : 0;
      const mes = Mes ? Number(Mes) : undefined;
      const año = Año ? Number(Año) : undefined;

      // Validar límite
      if (isNaN(limit) || limit < 1 || limit > MAXIMA_CANTIDAD_EVENTOS) {
        return res.status(400).json({
          success: false,
          message: `El límite debe ser un número entre 1 y ${MAXIMA_CANTIDAD_EVENTOS}`,
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar offset
      if (isNaN(offset) || offset < 0) {
        return res.status(400).json({
          success: false,
          message: "El offset debe ser un número mayor o igual a 0",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar mes si se proporciona
      if (mes !== undefined && (isNaN(mes) || mes < 1 || mes > 12)) {
        return res.status(400).json({
          success: false,
          message: "El mes debe ser un número entre 1 y 12",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar año si se proporciona
      if (año !== undefined && (isNaN(año) || año < 1900 || año > 2100)) {
        return res.status(400).json({
          success: false,
          message: "El año debe ser un número válido entre 1900 y 2100",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Buscar eventos usando la función unificada
      const { eventos, total } = await buscarEventos(
        { mes, año, limit, offset },
        rdp02EnUso
      );

      // Si no se encuentran eventos, devolver 404 con total = 0
      if (eventos.length === 0) {
        let notFoundMessage: string;
        if (mes !== undefined) {
          notFoundMessage = `No se encontraron eventos para el mes ${mes}${
            año ? ` del año ${año}` : ""
          }`;
        } else {
          notFoundMessage = "No se encontraron eventos en el sistema";
        }

        return res.status(404).json({
          success: true,
          message: notFoundMessage,
          data: [],
          total: 0,
        } as GetEventosSuccessResponse);
      }

      // Generar mensaje apropiado según el tipo de búsqueda
      let message: string;
      if (mes !== undefined) {
        message = `Se encontraron ${eventos.length} evento(s) de ${total} totales para el mes ${mes}${
          año ? ` del año ${año}` : ""
        }`;
      } else {
        message = `Se encontraron ${eventos.length} evento(s) de ${total} totales (eventos más antiguos)`;
      }

      // Respuesta exitosa con paginación
      return res.status(200).json({
        success: true,
        message,
        data: eventos,
        total,
      } as GetEventosSuccessResponse);
    } catch (error) {
      console.error("Error al buscar eventos:", error);

      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al buscar eventos",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: error,
      } as ErrorResponseAPIBase);
    }
  }) as any
);

// Ruta para registrar un nuevo evento
EventosRouter.post(
  "/",
  isDirectivoAuthenticated, // Solo directivos pueden registrar eventos
  checkAuthentication as any,
  (async (req: Request, res: Response) => {
    try {
      const { Nombre, Fecha_Inicio, Fecha_Conclusion }: RegistrarEventoRequesBody = req.body;
      const rdp02EnUso = req.RDP02_INSTANCE!;

      // Validar campos obligatorios
      if (!Nombre || !Fecha_Inicio || !Fecha_Conclusion) {
        return res.status(400).json({
          success: false,
          message: "Los campos Nombre, Fecha_Inicio y Fecha_Conclusion son obligatorios",
          errorType: RequestErrorTypes.MISSING_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar que Nombre no esté vacío y tenga longitud apropiada
      if (typeof Nombre !== 'string' || Nombre.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "El nombre del evento no puede estar vacío",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      if (Nombre.length > 150) {
        return res.status(400).json({
          success: false,
          message: "El nombre del evento no puede exceder 150 caracteres",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Convertir fechas a objetos Date
      const fechaInicio = new Date(Fecha_Inicio);
      const fechaConcusion = new Date(Fecha_Conclusion);

      // Validar que las fechas sean válidas
      if (isNaN(fechaInicio.getTime()) || isNaN(fechaConcusion.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Las fechas proporcionadas no son válidas",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar que la fecha de inicio sea menor o igual a la fecha de conclusión
      if (fechaInicio > fechaConcusion) {
        return res.status(400).json({
          success: false,
          message: "La fecha de inicio debe ser menor o igual a la fecha de conclusión",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar que no se puedan registrar eventos en fechas pasadas
      const fechaActual = new Date();
      // Normalizar fecha actual a solo fecha (sin hora) para comparación
      const fechaActualSoloFecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
      // Normalizar fechas del evento a solo fecha (sin hora)
      const fechaInicioSoloFecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
      const fechaConclusionSoloFecha = new Date(fechaConcusion.getFullYear(), fechaConcusion.getMonth(), fechaConcusion.getDate());

      // La fecha de inicio debe ser mayor que la fecha actual (desde mañana en adelante)
      if (fechaInicioSoloFecha <= fechaActualSoloFecha) {
        const fechaMañana = new Date(fechaActualSoloFecha);
        fechaMañana.setDate(fechaMañana.getDate() + 1);
        
        return res.status(400).json({
          success: false,
          message: `No se pueden registrar eventos en fechas pasadas o actuales. La fecha de inicio debe ser a partir del ${fechaMañana.toISOString().split('T')[0]}`,
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // La fecha de conclusión también debe ser mayor que la fecha actual
      if (fechaConclusionSoloFecha <= fechaActualSoloFecha) {
        const fechaMañana = new Date(fechaActualSoloFecha);
        fechaMañana.setDate(fechaMañana.getDate() + 1);
        
        return res.status(400).json({
          success: false,
          message: `No se pueden registrar eventos que concluyan en fechas pasadas o actuales. La fecha de conclusión debe ser a partir del ${fechaMañana.toISOString().split('T')[0]}`,
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Verificar conflicto de fechas exactas
      const hayConflicto = await verificarConflictoFechasExactas(
        fechaInicio,
        fechaConcusion,
        rdp02EnUso
      );

      if (hayConflicto) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un evento con las mismas fechas de inicio y conclusión",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Registrar el evento
      const eventoRegistrado = await registrarEvento(
        {
          Nombre: Nombre.trim(),
          Fecha_Inicio: fechaInicio,
          Fecha_Conclusion: fechaConcusion
        },
        rdp02EnUso
      );

      // REPLICANDO EN INSTANCIAS DEL RDP03
      await await consultarConEMCN01({
        collection:"T_Eventos",
        operation:"insertOne",
        data: transformarElementoParaRegistrarEnRDP03(eventoRegistrado, "Id_Evento")
      }, [RDP03.INS1,RDP03.INS2,RDP03.INS3,RDP03.INS4,RDP03.INS5])
      

      // Respuesta exitosa
      return res.status(201).json({
        success: true,
        message: `Evento "${eventoRegistrado.Nombre}" registrado exitosamente`,
        data: eventoRegistrado,
      } as RegistrarEventoSuccessResponse);

    } catch (error) {
      console.error("Error al registrar evento:", error);

      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al registrar el evento",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: error,
      } as ErrorResponseAPIBase);
    }
  }) as any
);


EventosRouter.put(
  "/:id",
  isDirectivoAuthenticated, // Solo directivos pueden modificar eventos
  checkAuthentication as any,
  (async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { Nombre, Fecha_Inicio, Fecha_Conclusion }: ModificarEventoRequestBody = req.body;
      const rdp02EnUso = req.RDP02_INSTANCE!;

      // Validar que el ID sea un número válido
      const idEvento = parseInt(id);
      if (isNaN(idEvento) || idEvento <= 0) {
        return res.status(400).json({
          success: false,
          message: "El ID del evento debe ser un número válido mayor a 0",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Buscar el evento por ID
      const eventoActual = await buscarEventoPorId(idEvento, rdp02EnUso);

      if (!eventoActual) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el evento con ID ${idEvento}`,
          errorType: RequestErrorTypes.RESOURCE_NOT_FOUND,
        } as ErrorResponseAPIBase);
      }

      // Determinar el estado del evento y qué se puede modificar
      const estadoEvento = determinarEstadoEvento(eventoActual);

      // Preparar datos de modificación
      const datosModificacion: DatosModificacionEvento = {};
      const camposModificados: string[] = [];

      // Validar y procesar Nombre
      if (Nombre !== undefined) {
        if (!estadoEvento.puedeModificarNombre) {
          return res.status(403).json({
            success: false,
            message: "No se puede modificar el nombre de este evento",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }

        if (typeof Nombre !== 'string' || Nombre.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: "El nombre del evento no puede estar vacío",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }

        if (Nombre.length > 150) {
          return res.status(400).json({
            success: false,
            message: "El nombre del evento no puede exceder 150 caracteres",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }

        datosModificacion.Nombre = Nombre;
        camposModificados.push('Nombre');
      }

      // Validar y procesar Fecha_Inicio
      if (Fecha_Inicio !== undefined) {
        if (!estadoEvento.puedeModificarInicio) {
          return res.status(403).json({
            success: false,
            message: estadoEvento.razonRestricciones || "No se puede modificar la fecha de inicio de este evento",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }

        const fechaInicio = new Date(Fecha_Inicio);
        if (isNaN(fechaInicio.getTime())) {
          return res.status(400).json({
            success: false,
            message: "La fecha de inicio proporcionada no es válida",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }

        // Para eventos futuros, validar que la nueva fecha de inicio sea futura
        if (estadoEvento.Estado === EstadoEvento.Pendiente) {
          const fechaActual = new Date();
          const fechaActualSoloFecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
          const fechaInicioSoloFecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());

          if (fechaInicioSoloFecha <= fechaActualSoloFecha) {
            const fechaMañana = new Date(fechaActualSoloFecha);
            fechaMañana.setDate(fechaMañana.getDate() + 1);
            
            return res.status(400).json({
              success: false,
              message: `La fecha de inicio debe ser a partir del ${fechaMañana.toISOString().split('T')[0]}`,
              errorType: RequestErrorTypes.INVALID_PARAMETERS,
            } as ErrorResponseAPIBase);
          }
        }

        datosModificacion.Fecha_Inicio = fechaInicio;
        camposModificados.push('Fecha_Inicio');
      }

      // Validar y procesar Fecha_Conclusion
      if (Fecha_Conclusion !== undefined) {
        if (!estadoEvento.puedeModificarConclusión) {
          return res.status(403).json({
            success: false,
            message: estadoEvento.razonRestricciones || "No se puede modificar la fecha de conclusión de este evento",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }

        const fechaConcusion = new Date(Fecha_Conclusion);
        if (isNaN(fechaConcusion.getTime())) {
          return res.status(400).json({
            success: false,
            message: "La fecha de conclusión proporcionada no es válida",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }

        // Validar que la fecha de conclusión sea futura para eventos futuros y activos
        if (estadoEvento.Estado === EstadoEvento.Pendiente || estadoEvento.Estado === EstadoEvento.Activo) {
          const fechaActual = new Date();
          const fechaActualSoloFecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
          const fechaConclusionSoloFecha = new Date(fechaConcusion.getFullYear(), fechaConcusion.getMonth(), fechaConcusion.getDate());

          // Para eventos activos, la fecha de conclusión debe ser hoy o futura
          const fechaMinimaPermitida = estadoEvento.Estado === EstadoEvento.Activo ? fechaActualSoloFecha : fechaActualSoloFecha;

          if (fechaConclusionSoloFecha < fechaMinimaPermitida) {
            return res.status(400).json({
              success: false,
              message: `La fecha de conclusión no puede ser anterior a ${estadoEvento.Estado === EstadoEvento.Activo ? 'hoy' : 'mañana'}`,
              errorType: RequestErrorTypes.INVALID_PARAMETERS,
            } as ErrorResponseAPIBase);
          }
        }

        datosModificacion.Fecha_Conclusion = fechaConcusion;
        camposModificados.push('Fecha_Conclusion');
      }

      // Verificar que se envió al menos un campo para modificar
      if (camposModificados.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar al menos un campo para modificar (Nombre, Fecha_Inicio, Fecha_Conclusion)",
          errorType: RequestErrorTypes.MISSING_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar relación entre fechas si se modifican ambas o una en relación con la existente
      const fechaInicioFinal = datosModificacion.Fecha_Inicio || new Date(eventoActual.Fecha_Inicio);
      const fechaConclusionFinal = datosModificacion.Fecha_Conclusion || new Date(eventoActual.Fecha_Conclusion);

      if (fechaInicioFinal > fechaConclusionFinal) {
        return res.status(400).json({
          success: false,
          message: "La fecha de inicio debe ser menor o igual a la fecha de conclusión",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Verificar conflicto de fechas exactas con otros eventos
      if ((datosModificacion.Fecha_Inicio || datosModificacion.Fecha_Conclusion)) {
        const hayConflicto = await verificarConflictoFechasExactasModificacion(
          fechaInicioFinal,
          fechaConclusionFinal,
          idEvento,
          rdp02EnUso
        );

        if (hayConflicto) {
          return res.status(409).json({
            success: false,
            message: "Ya existe otro evento con las mismas fechas de inicio y conclusión",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }
      }

      // Modificar el evento
      const eventoModificado = await modificarEvento(idEvento, datosModificacion, rdp02EnUso);

      // REPLICANDO EN INSTANCIAS DEL RDP03
      await consultarConEMCN01({
        collection:"T_Eventos",
        operation:"updateOne",
        filter:{_id :idEvento},
        data:{
          $set: (({_id, ...restoDePropiedades})=>restoDePropiedades)(transformarElementoParaRegistrarEnRDP03(eventoModificado, "Id_Evento"))
        }
      }, [RDP03.INS1,RDP03.INS2,RDP03.INS3,RDP03.INS4,RDP03.INS5
      ])

      // Respuesta exitosa
      return res.status(200).json({
        success: true,
        message: `Evento "${eventoModificado.Nombre}" modificado exitosamente`,
        data: eventoModificado,
        camposModificados,
        Estado: estadoEvento.Estado,
      } as ModificarEventoSuccessResponse);

    } catch (error) {
      console.error("Error al modificar evento:", error);

      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al modificar el evento",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: error,
      } as ErrorResponseAPIBase);
    }
  }) as any
);


EventosRouter.delete(
  "/:id",
  isDirectivoAuthenticated, // Solo directivos pueden eliminar eventos
  checkAuthentication as any,
  (async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rdp02EnUso = req.RDP02_INSTANCE!;

      // Validar que el ID sea un número válido
      const idEvento = parseInt(id);
      if (isNaN(idEvento) || idEvento <= 0) {
        return res.status(400).json({
          success: false,
          message: "El ID del evento debe ser un número válido mayor a 0",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Buscar el evento por ID
      const evento = await buscarEventoPorId(idEvento, rdp02EnUso);

      if (!evento) {
        return res.status(404).json({
          success: false,
          message: `El evento que intentas eliminar no existe o ya ha sido eliminado`,
          errorType: RequestErrorTypes.RESOURCE_NOT_FOUND,
        } as ErrorResponseAPIBase);
      }

      // Verificar si el evento puede ser eliminado
      const { puedeEliminarse, razon } = verificarSiEventoPuedeEliminarse(evento);

      if (!puedeEliminarse) {
        return res.status(403).json({
          success: false,
          message: razon || "No se puede eliminar este evento",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Eliminar el evento
      const eventoEliminado = await eliminarEvento(idEvento, rdp02EnUso);

      // REPLICANDO EN INSTANCIAS DEL RDP03
      await consultarConEMCN01({
        collection:"T_Eventos",
        operation:"deleteOne",
        filter:{_id: eventoEliminado.Id_Evento}
      }, [RDP03.INS1,RDP03.INS2,RDP03.INS3, RDP03.INS4, RDP03.INS5])

      // Respuesta exitosa
      return res.status(200).json({
        success: true,
        message: `Evento "${eventoEliminado.Nombre}" eliminado exitosamente`,
        data: eventoEliminado,
      } as EliminarEventoSuccessResponse);

    } catch (error) {
      console.error("Error al eliminar evento:", error);

      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar el evento",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: error,
      } as ErrorResponseAPIBase);
    }
  }) as any
);


export default EventosRouter;