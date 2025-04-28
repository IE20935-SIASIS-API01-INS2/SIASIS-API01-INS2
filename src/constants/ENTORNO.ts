import { Entorno } from "../interfaces/shared/Entornos";

export const ENTORNO =
  process.env.ENTORNO! || (Entorno.CERTIFICACION as Entorno);
