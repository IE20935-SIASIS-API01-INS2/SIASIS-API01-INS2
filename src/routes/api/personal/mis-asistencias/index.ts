import { Request, Response, Router } from "express";
import {
  DataErrorTypes,
  RequestErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
} from "../../../../interfaces/shared/apis/errors";
import { ErrorResponseAPIBase } from "../../../../interfaces/shared/apis/types";
import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import {
  AuxiliarAuthenticated,
  PersonalAdministrativoAuthenticated,
  ProfesorPrimariaAuthenticated,
  ProfesorTutorSecundariaAuthenticated,
} from "../../../../interfaces/shared/JWTPayload";
import { buscarUsuarioGenericoPorRolYDNI } from "../../../../../core/databases/queries/RDP02/usuario-generico/buscarUsuarioGenericoPorRolYDNI";
import { buscarAsistenciaMensualPorRol } from "../../../../../core/databases/queries/RDP02/asistencias-mensuales/buscarAsistenciaMensualPorRolDNI";
import {
  AsistenciaCompletaMensualDePersonal,
  GetAsistenciaMensualDePersonalSuccessResponse,
} from "../../../../interfaces/shared/apis/api01/personal/types";
import { Meses } from "../../../../interfaces/shared/Meses";

const MisAsistenciasMensualesRouter = Router();

MisAsistenciasMensualesRouter.get("/", (async (req: Request, res: Response) => {
  try {
    const { Mes } = req.query;
    const userData = req.user!;
    const userRole = req.userRole!;
    const rdp02EnUso = req.RDP02_INSTANCE!;

    // Convertir mes a número
    const mes = parseInt(Mes as string);

    // Validar mes (1-12)
    if (isNaN(mes) || mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: "El mes debe ser un número entre 1 y 12",
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      } as ErrorResponseAPIBase);
    }

    // Verificar que el rol autenticado tiene control de asistencia
    const rolesSinAsistencia = [
      RolesSistema.Directivo,
      RolesSistema.Responsable,
    ];
    if (rolesSinAsistencia.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `El rol "${userRole}" no tiene control de asistencia laboral`,
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      } as ErrorResponseAPIBase);
    }

    // Extraer DNI según el rol del usuario autenticado
    let dniUsuario: string;

    switch (userRole) {
      case RolesSistema.ProfesorPrimaria:
        dniUsuario = (userData as ProfesorPrimariaAuthenticated)
          .DNI_Profesor_Primaria;
        break;

      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
        dniUsuario = (userData as ProfesorTutorSecundariaAuthenticated)
          .DNI_Profesor_Secundaria;
        break;

      case RolesSistema.Auxiliar:
        dniUsuario = (userData as AuxiliarAuthenticated).DNI_Auxiliar;
        break;

      case RolesSistema.PersonalAdministrativo:
        dniUsuario = (userData as PersonalAdministrativoAuthenticated)
          .DNI_Personal_Administrativo;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Rol no soportado para consulta de asistencias: ${userRole}`,
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
    }

    // Buscar datos básicos del personal (para confirmar que existe y está activo)
    const personalData = await buscarUsuarioGenericoPorRolYDNI(
      userRole,
      dniUsuario,
      rdp02EnUso
    );

    if (!personalData) {
      return res.status(404).json({
        success: false,
        message: `No se encontraron datos del usuario o el usuario está inactivo`,
        errorType: UserErrorTypes.USER_NOT_FOUND,
      } as ErrorResponseAPIBase);
    }

    // Buscar asistencias del mes
    const asistenciasData = await buscarAsistenciaMensualPorRol(
      userRole,
      dniUsuario,
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
      Id_Registro_Mensual_Entrada: asistenciasData.Id_Registro_Mensual_Entrada,
      Id_Registro_Mensual_Salida: asistenciasData.Id_Registro_Mensual_Salida,
      DNI_Usuario: personalData.DNI_Usuario,
      Rol: personalData.Rol,
      Nombres: personalData.Nombres,
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
    console.error("Error al buscar mis asistencias mensuales:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al buscar mis asistencias mensuales",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

export default MisAsistenciasMensualesRouter;
