// verificarBloqueoRol.ts
import { Request, NextFunction } from "express";
import { T_Bloqueo_Roles } from "@prisma/client";
import { RDP02 } from "../../../interfaces/shared/RDP02Instancias";
import { RolesSistema } from "../../../interfaces/shared/RolesSistema";
import { RolesTexto } from "../../../../assets/RolesTextosEspañol";
import { ErrorObjectGeneric } from "../../../interfaces/shared/errors/details";
import {
  PermissionErrorTypes,
  SystemErrorTypes,
} from "../../../interfaces/shared/errors";
import { AuthBlockedDetails } from "../../../interfaces/shared/errors/details/AuthBloquedDetails";
import { query } from "../../../../core/databases/connectors/postgres";

/**
 * Consulta la base de datos para verificar si un rol está bloqueado
 * @param rol - Rol a verificar
 * @param instanciaEnUso - Instancia específica donde ejecutar la consulta (opcional)
 * @returns Información del bloqueo o null si no existe
 */
export async function consultarBloqueoRol(
  rol: RolesSistema,
  instanciaEnUso?: RDP02
): Promise<T_Bloqueo_Roles | null> {
  const sql = `
    SELECT *
    FROM "T_Bloqueo_Roles"
    WHERE "Rol" = $1 
    AND (
      "Bloqueo_Total" = true 
      OR "Timestamp_Desbloqueo" > $2
    )
  `;

  const tiempoActualUnix = Math.floor(Date.now() / 1000);

  const result = await query<T_Bloqueo_Roles>(instanciaEnUso, sql, [
    rol,
    tiempoActualUnix,
  ]);

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Verifica si un rol está bloqueado y configura el error correspondiente en el middleware
 * @param req - Objeto Request de Express
 * @param rol - Rol a verificar (del enum RolesSistema)
 * @param next - Función NextFunction de Express
 * @param instanciaEnUso - Instancia específica donde ejecutar la consulta (opcional)
 * @returns Promise<boolean> - true si está bloqueado, false si no
 */
export async function verificarBloqueoRol(
  req: Request,
  rol: RolesSistema,
  next: NextFunction,
  instanciaEnUso?: RDP02
): Promise<boolean> {
  try {
    const bloqueo = await consultarBloqueoRol(rol, instanciaEnUso);

    if (bloqueo) {
      const tiempoActualUnix = Math.floor(Date.now() / 1000);
      const timestampDesbloqueo = Number(bloqueo.Timestamp_Desbloqueo);

      // Determinar si es bloqueo permanente
      const esBloqueoPermanente =
        bloqueo.Bloqueo_Total ||
        timestampDesbloqueo <= 0 ||
        timestampDesbloqueo <= tiempoActualUnix;

      // Calcular tiempo restante solo si NO es permanente
      let tiempoRestante = "Permanente";
      let fechaFormateada = "No definida";

      if (!esBloqueoPermanente) {
        const tiempoRestanteSegundos = timestampDesbloqueo - tiempoActualUnix;
        const horasRestantes = Math.floor(tiempoRestanteSegundos / 3600);
        const minutosRestantes = Math.floor(
          (tiempoRestanteSegundos % 3600) / 60
        );
        tiempoRestante = `${horasRestantes}h ${minutosRestantes}m`;

        // Formatear fecha de desbloqueo
        const fechaDesbloqueo = new Date(timestampDesbloqueo * 1000);
        fechaFormateada = fechaDesbloqueo.toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Obtener nombre del rol en plural
      const nombreRolPlural =
        RolesTexto[rol]?.plural?.toLowerCase() || "usuarios";

      const errorDetails: AuthBlockedDetails = {
        tiempoActualUTC: tiempoActualUnix,
        timestampDesbloqueoUTC: timestampDesbloqueo,
        tiempoRestante: tiempoRestante,
        fechaDesbloqueo: fechaFormateada,
        esBloqueoPermanente: esBloqueoPermanente,
      };

      req.authError = {
        type: PermissionErrorTypes.ROLE_BLOCKED,
        message: esBloqueoPermanente
          ? `El acceso para ${nombreRolPlural} está permanentemente bloqueado`
          : `El acceso para ${nombreRolPlural} está temporalmente bloqueado`,
        details: errorDetails,
      };

      next();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error al verificar bloqueo de rol:", error);

    req.authError = {
      type: SystemErrorTypes.DATABASE_ERROR,
      message: "Error al verificar el estado del rol",
      details: error as ErrorObjectGeneric,
    };
    next();
    return true; // Conservador: asumir bloqueo en caso de error
  }
}
