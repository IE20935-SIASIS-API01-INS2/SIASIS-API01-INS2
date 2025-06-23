// verificarBloqueoRol.ts
import { Request, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { RolesSistema } from "../../../interfaces/shared/RolesSistema";
import { RolesTexto } from "../../../../assets/RolesTextosEspañol";

import { ErrorObjectGeneric } from "../../../interfaces/shared/errors/details";
import {
  PermissionErrorTypes,
  SystemErrorTypes,
} from "../../../interfaces/shared/errors";

const prisma = new PrismaClient();

/**
 * Verifica si un rol está bloqueado y configura el error correspondiente
 * @param req - Objeto Request de Express
 * @param rol - Rol a verificar (del enum RolesSistema)
 * @param next - Función NextFunction de Express
 * @returns Promesa<boolean> - true si está bloqueado, false si no
 */
export async function verificarBloqueoRol(
  req: Request,
  rol: RolesSistema,
  next: NextFunction
): Promise<boolean> {
  try {
    const bloqueo = await prisma.t_Bloqueo_Roles.findFirst({
      where: {
        Rol: rol,
        OR: [
          {
            Timestamp_Desbloqueo: {
              gt: Math.floor(Date.now() / 1000),
            },
          },
          {
            Bloqueo_Total: true,
          },
        ],
      },
    });

    if (bloqueo) {
      const ahora = new Date();
      const tiempoDesbloqueo = bloqueo.Timestamp_Desbloqueo
        ? new Date(Number(bloqueo.Timestamp_Desbloqueo) * 1000)
        : null;

      const tiempoRestante = tiempoDesbloqueo
        ? Math.ceil(
            (tiempoDesbloqueo.getTime() - ahora.getTime()) / (1000 * 60)
          )
        : null;

      // Obtener el nombre plural del rol desde el objeto RolesTexto
      const nombreRolPlural = RolesTexto[rol].plural.toLowerCase();

      req.authError = {
        type: PermissionErrorTypes.ROLE_BLOCKED,
        message: bloqueo.Bloqueo_Total
          ? `Acceso permanentemente bloqueado para ${nombreRolPlural}. Contacte al administrador del sistema.`
          : `Acceso temporalmente bloqueado para ${nombreRolPlural}. Intente nuevamente más tarde.`,
        details: {
          esBloqueoPermanente: bloqueo.Bloqueo_Total,
          tiempoDesbloqueo: tiempoDesbloqueo?.toISOString(),
          tiempoRestanteMinutos: tiempoRestante,
          tiempoRestanteFormateado: tiempoRestante
            ? tiempoRestante > 60
              ? `${Math.floor(tiempoRestante / 60)} horas y ${
                  tiempoRestante % 60
                } minutos`
              : `${tiempoRestante} minutos`
            : "Indefinido",
          fechaActual: ahora.toISOString(),
          fechaDesbloqueo: tiempoDesbloqueo?.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      };
      next();
      return true;
    }
    return false;
  } catch (error) {
    req.authError = {
      type: SystemErrorTypes.DATABASE_ERROR,
      message: "Error al verificar el estado del rol",
      details: error as ErrorObjectGeneric,
    };
    next();
    return true; // Consideramos que hay bloqueo en caso de error para ser conservadores
  }
}
