import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";
import { SystemErrorTypes } from "../../../interfaces/shared/apis/errors";
import { handlePrismaError } from "../../../lib/helpers/handlers/errors/prisma";
import { GetUltimasModificacionesSuccessResponse } from "../../../interfaces/shared/apis/shared/modificaciones-tablas/types";
import { TablasSistema } from "../../../interfaces/shared/TablasSistema";

const router = Router();
const prisma = new PrismaClient();

// Obtener las últimas modificaciones de las tablas
router.get("/", (async (req: Request, res: Response) => {
  try {
    // Obtener el parámetro de consulta 'tablas' si existe
    const tablasParam = req.query.tablas as string | undefined;

    // Construir la condición where basada en el parámetro
    let whereCondition = {};

    if (tablasParam) {
      // Dividir el parámetro por comas y eliminar espacios en blanco
      const tablasEnums = tablasParam.split(",").map((tabla) => tabla.trim());

      // Convertir los valores de los enums a nombres reales de tablas
      const tablasReales = tablasEnums.map((enumValue) => {
        // Comprobamos si el valor es un enum válido
        const matchingKey = Object.keys(TablasSistema).find(
          (key) => key.toLowerCase() === enumValue.toLowerCase()
        );

        // Si encontramos una coincidencia, usamos el valor del enum
        if (matchingKey) {
          return TablasSistema[matchingKey as keyof typeof TablasSistema];
        }

        // Si no encontramos coincidencia, asumimos que es un nombre directo de tabla
        return enumValue;
      });

      // Si hay tablas especificadas, filtrar por ellas
      if (tablasReales.length > 0) {
        whereCondition = {
          Nombre_Tabla: {
            in: tablasReales,
          },
        };
      }
    }

    // Consultar la base de datos
    const modificaciones = await prisma.t_Ultima_Modificacion_Tablas.findMany({
      where: whereCondition,
      orderBy: {
        Fecha_Modificacion: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Últimas modificaciones obtenidas exitosamente",
      data: modificaciones,
    } as GetUltimasModificacionesSuccessResponse);
  } catch (error) {
    console.error("Error al obtener últimas modificaciones:", error);

    const handledError = handlePrismaError(error);
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
