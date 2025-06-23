import { Request, Response, Router } from "express";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";
import { SystemErrorTypes } from "../../../interfaces/shared/errors";
import { GetUltimasModificacionesSuccessResponse } from "../../../interfaces/shared/apis/shared/modificaciones-tablas/types";
import { handleSQLError } from "../../../lib/helpers/handlers/errors/postgreSQL";
import { obtenerUltimasModificacionesTablas } from "../../../../core/databases/queries/RDP02/ultimas-modificaciones/obtenerUltimasModificacionesTablas";

const router = Router();

// Obtener las últimas modificaciones de las tablas
router.get("/", (async (req: Request, res: Response) => {
  try {
    // Obtener la instancia RDP02 que se está utilizando
    const rdp02EnUso = req.RDP02_INSTANCE;

    // Obtener las modificaciones de las tablas utilizando la función creada
    const modificaciones = await obtenerUltimasModificacionesTablas(rdp02EnUso);

    return res.status(200).json({
      success: true,
      message: "Últimas modificaciones obtenidas exitosamente",
      data: modificaciones,
    } as GetUltimasModificacionesSuccessResponse);
  } catch (error) {
    console.error("Error al obtener últimas modificaciones:", error);

    const handledError = handleSQLError(error);
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    return res.status(500).json({
      success: false,
      message: "Error al obtener últimas modificaciones",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

export default router;
