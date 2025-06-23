import { Router } from "express";
import wereObligatoryQueryParamsReceived from "../../../middlewares/wereObligatoryQueryParamsReceived";
import { RolesSistema } from "../../../interfaces/shared/RolesSistema";
import {
  RequestErrorTypes,
  SystemErrorTypes,
} from "../../../interfaces/shared/errors";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";

import isDirectivoAuthenticated from "../../../middlewares/isDirectivoAuthenticated";
import checkAuthentication from "../../../middlewares/checkAuthentication";
import { buscarUsuariosGenericosPorRolYCriterio } from "../../../../core/databases/queries/RDP02/usuarios-genericos/buscarUsuariosGenericosPorDatosBasicos";
import { GetGenericUsersSuccessResponse } from "../../../interfaces/shared/apis/api01/usuarios-genericos/types";

const UsuarioGenericoRouter = Router();

UsuarioGenericoRouter.get(
  "/",
  wereObligatoryQueryParamsReceived(["Rol"]) as any,
  isDirectivoAuthenticated,
  checkAuthentication as any,
  (async (req: any, res: any) => {
    try {
      const { Rol, Criterio, Limite } = req.query as any;
      const rdp02EnUso = req.RDP02_INSTANCE!;

      // Validar que el rol es válido
      if (!Object.values(RolesSistema).includes(Rol as RolesSistema)) {
        return res.status(400).json({
          success: false,
          message: `Rol inválido. Roles permitidos: ${Object.values(
            RolesSistema
          )
            .filter((rol) => rol !== RolesSistema.Responsable) // Excluir Responsable
            .join(", ")}`,
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar que no sea el rol Responsable
      if (Rol === RolesSistema.Responsable) {
        return res.status(400).json({
          success: false,
          message:
            "La búsqueda de responsables no está soportada en este endpoint",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar y parsear el límite
      let limiteNumerico = 10; // Valor por defecto
      if (Limite !== undefined && Limite !== "") {
        const limiteParseado = parseInt(Limite as string, 10);

        if (isNaN(limiteParseado) || limiteParseado < 1) {
          return res.status(400).json({
            success: false,
            message: "El parámetro 'Limite' debe ser un número entero positivo",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }

        if (limiteParseado > 10) {
          return res.status(400).json({
            success: false,
            message: "El límite máximo permitido es 10 registros",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }

        limiteNumerico = limiteParseado;
      }

      // Validar criterio de búsqueda (opcional)
      let criterioLimpio: string | undefined = undefined;
      if (Criterio !== undefined && Criterio !== "") {
        const criterioStr = (Criterio as string).trim();

        if (criterioStr.length === 0) {
          criterioLimpio = undefined; // Criterio vacío = buscar todos
        } else if (criterioStr.length < 2) {
          return res.status(400).json({
            success: false,
            message: "El criterio de búsqueda debe tener al menos 2 caracteres",
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        } else {
          criterioLimpio = criterioStr;
        }
      }

      // Buscar usuarios según rol y criterio
      const usuariosEncontrados = await buscarUsuariosGenericosPorRolYCriterio(
        Rol as RolesSistema,
        criterioLimpio,
        limiteNumerico,
        rdp02EnUso
      );

      // Preparar respuesta
      const mensaje = criterioLimpio
        ? `Se encontraron ${usuariosEncontrados.length} usuario(s) con rol "${Rol}" que coinciden con el criterio "${criterioLimpio}"`
        : `Se encontraron ${usuariosEncontrados.length} usuario(s) con rol "${Rol}"`;

      // Respuesta exitosa
      return res.status(200).json({
        success: true,
        message: mensaje,
        data: usuariosEncontrados,
        total: usuariosEncontrados.length,
        criterio: criterioLimpio || null,
      } as GetGenericUsersSuccessResponse);
    } catch (error) {
      console.error("Error al buscar usuarios genéricos:", error);

      // Manejar errores específicos
      if (error instanceof Error) {
        if (error.message.includes("no está soportada")) {
          return res.status(400).json({
            success: false,
            message: error.message,
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }

        if (error.message.includes("Rol no soportado")) {
          return res.status(400).json({
            success: false,
            message: error.message,
            errorType: RequestErrorTypes.INVALID_PARAMETERS,
          } as ErrorResponseAPIBase);
        }
      }

      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al buscar usuarios",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: process.env.NODE_ENV === "development" ? error : undefined,
      } as ErrorResponseAPIBase);
    }
  }) as any
);

export default UsuarioGenericoRouter;
