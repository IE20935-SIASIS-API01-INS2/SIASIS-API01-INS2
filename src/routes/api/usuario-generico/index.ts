import { Router } from "express";
import wereObligatoryQueryParamsReceived from "../../../middlewares/wereObligatoryQueryParamsReceived";
import { RolesSistema } from "../../../interfaces/shared/RolesSistema";
import {
  RequestErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
} from "../../../interfaces/shared/apis/errors";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";

import { GetGenericUserSuccessResponse } from "../../../interfaces/shared/apis/api01/usuario-generico/types";
import { buscarUsuarioGenericoPorRolYDNI } from "../../../../core/databases/queries/RDP02/usuario-generico/buscarUsuarioGenericoPorRolYDNI";
import isDirectivoAuthenticated from "../../../middlewares/isDirectivoAuthenticated";
import checkAuthentication from "../../../middlewares/checkAuthentication";
const UsuarioGenericoRouter = Router();

UsuarioGenericoRouter.get(
  "/",
  wereObligatoryQueryParamsReceived(["Rol", "DNI"]) as any,
  isDirectivoAuthenticated,
  checkAuthentication as any,
  (async (req: any, res: any) => {
    try {
      const { Rol, DNI } = req.query as any;
      const rdp02EnUso = req.RDP02_INSTANCE!;

      // Validar que los parámetros están presentes (ya validado por middleware)
      const rol = Rol as string;
      const dni = DNI as string;

      // Validar que el rol es válido
      if (!Object.values(RolesSistema).includes(rol as RolesSistema)) {
        return res.status(400).json({
          success: false,
          message: `Rol inválido. Roles permitidos: ${Object.values(
            RolesSistema
          ).join(", ")}`,
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar formato del DNI (8 dígitos)
      if (!/^\d{8}$/.test(dni)) {
        return res.status(400).json({
          success: false,
          message: "El DNI debe tener exactamente 8 dígitos",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Buscar el personal según rol y DNI
      const personalData = await buscarUsuarioGenericoPorRolYDNI(
        rol as RolesSistema,
        dni,
        rdp02EnUso
      );

      // Verificar si se encontró el usuario
      if (!personalData) {
        return res.status(404).json({
          success: false,
          message: `No se encontró personal con rol "${rol}" y DNI "${dni}" o el usuario está inactivo`,
          errorType: UserErrorTypes.USER_NOT_FOUND,
        } as ErrorResponseAPIBase);
      }

      // Respuesta exitosa
      return res.status(200).json({
        success: true,
        data: personalData,
      } as GetGenericUserSuccessResponse);
    } catch (error) {
      console.error("Error al buscar personal genérico:", error);

      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al buscar personal",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: error,
      } as ErrorResponseAPIBase);
    }
  }) as any
);

export default UsuarioGenericoRouter;
