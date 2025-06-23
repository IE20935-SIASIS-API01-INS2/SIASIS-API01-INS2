import { Request, Response, Router } from "express";
import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import { Meses } from "../../../../interfaces/shared/Meses";

import { ErrorResponseAPIBase } from "../../../../interfaces/shared/apis/types";
import {
  RequestErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
  DataErrorTypes,
} from "../../../../interfaces/shared/errors";

import wereObligatoryQueryParamsReceived from "../../../../middlewares/wereObligatoryQueryParamsReceived";
import { buscarAsistenciaMensualPorRol } from "../../../../../core/databases/queries/RDP02/asistencias-mensuales/buscarAsistenciaMensualPorRolDNI";
import {
  AsistenciaCompletaMensualDePersonal,
  GetAsistenciaMensualDePersonalSuccessResponse,
} from "../../../../interfaces/shared/apis/api01/personal/types";
import { buscarUsuarioGenericoPorRolyIDoDNI } from "../../../../../core/databases/queries/RDP02/usuarios-genericos/buscarUsuarioGenericoPorRolyIDoDNI";

const AsistenciasMensualesDePersonalRouter = Router();

AsistenciasMensualesDePersonalRouter.get(
  "/",
  wereObligatoryQueryParamsReceived(["Rol", "ID_O_DNI", "Mes"]) as any,
  (async (req: Request, res: Response) => {
    try {
      const { Rol, ID_O_DNI, Mes } = req.query;
      const rdp02EnUso = req.RDP02_INSTANCE!;

      // Convertir a tipos apropiados
      const rol = Rol as string;
      const idODni = ID_O_DNI as string;
      const mes = parseInt(Mes as string);

      // Validar que el rol es válido
      const rolesValidos = Object.values(RolesSistema);
      if (!rolesValidos.includes(rol as RolesSistema)) {
        return res.status(400).json({
          success: false,
          message: `Rol inválido. Roles permitidos: ${rolesValidos.join(", ")}`,
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar formato del DNI (8 dígitos)
      if (rol !== RolesSistema.Directivo && !/^\d{8}$/.test(idODni)) {
        return res.status(400).json({
          success: false,
          message: "El DNI debe tener exactamente 8 dígitos numéricos",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar mes (1-12)
      if (isNaN(mes) || mes < 1 || mes > 12) {
        return res.status(400).json({
          success: false,
          message: "El mes debe ser un número entre 1 y 12",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Validar que el rol tiene control de asistencia
      const rolesSinAsistencia = [RolesSistema.Responsable];
      if (rolesSinAsistencia.includes(rol as RolesSistema)) {
        return res.status(400).json({
          success: false,
          message: `El rol "${rol}" no tiene control de asistencia laboral`,
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
      }

      // Buscar datos básicos del personal
      const personalData = await buscarUsuarioGenericoPorRolyIDoDNI(
        rol as RolesSistema,
        idODni,
        rdp02EnUso
      );

      if (!personalData) {
        return res.status(404).json({
          success: false,
          message: `No se encontró personal con rol "${rol}" y DNI "${idODni}", o el usuario está inactivo`,
          errorType: UserErrorTypes.USER_NOT_FOUND,
        } as ErrorResponseAPIBase);
      }

      // Buscar asistencias del mes
      const asistenciasData = await buscarAsistenciaMensualPorRol(
        rol as RolesSistema,
        idODni,
        mes,
        rdp02EnUso
      );

      if (!asistenciasData) {
        return res.status(404).json({
          success: false,
          message: `No se encontraron registros de asistencia para el mes ${mes}. Es posible que el mes consultado no tenga datos registrados aún.`,
          errorType: DataErrorTypes.NO_DATA_AVAILABLE,
        } as ErrorResponseAPIBase);
      }

      // Combinar datos del personal con asistencias
      const asistenciaCompleta: AsistenciaCompletaMensualDePersonal = {
        Id_Registro_Mensual_Entrada:
          asistenciasData.Id_Registro_Mensual_Entrada,
        Id_Registro_Mensual_Salida: asistenciasData.Id_Registro_Mensual_Salida,
        ID_O_DNI_Usuario: personalData.ID_O_DNI_Usuario,
        Rol: personalData.Rol,
        Nombres: personalData.Nombres,
        Google_Drive_Foto_ID: personalData.Google_Drive_Foto_ID,
        Apellidos: personalData.Apellidos,
        Genero: personalData.Genero,
        Entradas: asistenciasData.Entradas,
        Salidas: asistenciasData.Salidas,
        Mes: mes as Meses,
      };

      // Respuesta exitosa
      return res.status(200).json({
        success: true,
        data: asistenciaCompleta,
      } as GetAsistenciaMensualDePersonalSuccessResponse);
    } catch (error) {
      console.error(
        "Error al buscar asistencias mensuales de personal:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al buscar asistencias mensuales",
        errorType: SystemErrorTypes.UNKNOWN_ERROR,
        details: error,
      } as ErrorResponseAPIBase);
    }
  }) as any
);

export default AsistenciasMensualesDePersonalRouter;
