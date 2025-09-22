import { T_Eventos } from "@prisma/client";
import { SuccessResponseAPIBase } from "../types";
import { EstadoEvento } from "../../EstadoEventos";

export interface GetEventosSuccessResponse extends SuccessResponseAPIBase {
  data: T_Eventos[];
  total: number;
}


export interface BuscarEventosParams {
  Mes?: number;
  Año?: number;
  Limit?: number;
  Offset?: number;
}   



export type RegistrarEventoRequesBody = Pick<T_Eventos,"Nombre"|"Fecha_Inicio"|"Fecha_Conclusion">


export interface RegistrarEventoSuccessResponse extends SuccessResponseAPIBase {
  data: T_Eventos;
}



export interface ModificarEventoRequestBody {
  Nombre?: string;
  Fecha_Inicio?: string | Date;
  Fecha_Conclusion?: string | Date;
}

export interface ModificarEventoSuccessResponse extends SuccessResponseAPIBase {
  data: T_Eventos;
  camposModificados: string[];
  Estado: EstadoEvento
}


export interface EliminarEventoSuccessResponse extends SuccessResponseAPIBase {
  data: T_Eventos;
}