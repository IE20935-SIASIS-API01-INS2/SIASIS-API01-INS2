import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import { generateProfesorSecundariaToken } from "../../../../lib/helpers/functions/jwt/generators/profesorSecundariaToken";
import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import { Genero } from "../../../../interfaces/shared/Genero";
import { generateTutorToken } from "../../../../lib/helpers/functions/jwt/generators/tutorToken";
import { verifyProfesorTutorSecundariaPassword } from "../../../../lib/helpers/encriptations/profesorTutotSecundaria.encriptation";
import { ResponseSuccessLogin } from "../../../../interfaces/shared/apis/shared/login/types";
import { AuthBlockedDetails } from "../../../../interfaces/shared/apis/errors/details/AuthBloquedDetails";

const router = Router();
const prisma = new PrismaClient();

export interface LoginBody {
  Nombre_Usuario: string;
  Contraseña: string;
}

router.get("/", (async (req: Request, res: Response) => {
  return res.json({ message: "Login Profesor Secundaria / Tutor" });
}) as any);

// Ruta de login para Profesores de Secundaria / Tutores
router.post("/", (async (req: Request, res: Response) => {
  try {
    const { Nombre_Usuario, Contraseña }: LoginBody = req.body;

    // Validar que se proporcionen ambos campos
    if (!Nombre_Usuario || !Contraseña) {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario y la contraseña son obligatorios",
      });
    }

    // Este endpoint se usa tanto para profesores de secundaria como para tutores
    // Verificamos bloqueos para ambos roles antes de continuar
    try {
      const tiempoActual = Math.floor(Date.now() / 1000); // Timestamp Unix actual en segundos

      // Verificar bloqueo para Profesor Secundaria (sin filtro de timestamp)
      const bloqueoProfesorSecundaria = await prisma.t_Bloqueo_Roles.findFirst({
        where: {
          Rol: RolesSistema.ProfesorSecundaria,
          Bloqueo_Total: true,
        },
      });

      // Verificar bloqueo para Tutor (sin filtro de timestamp)
      const bloqueoTutor = await prisma.t_Bloqueo_Roles.findFirst({
        where: {
          Rol: RolesSistema.Tutor,
          Bloqueo_Total: true,
        },
      });

      // Si ambos roles están bloqueados, informamos sobre el que tiene mayor tiempo de bloqueo
      // o indicamos que es un bloqueo permanente si ambos lo son
      if (bloqueoProfesorSecundaria && bloqueoTutor) {
        const timestampProfesorSecundaria = Number(
          bloqueoProfesorSecundaria.Timestamp_Desbloqueo
        );
        const timestampTutor = Number(bloqueoTutor.Timestamp_Desbloqueo);

        // Determinar cuál de los dos tiene un timestamp mayor o si ambos son permanentes
        const esProfesorPermanente =
          timestampProfesorSecundaria <= 0 ||
          timestampProfesorSecundaria <= tiempoActual;
        const esTutorPermanente =
          timestampTutor <= 0 || timestampTutor <= tiempoActual;

        // Si ambos son permanentes
        if (esProfesorPermanente && esTutorPermanente) {
          const errorDetails: AuthBlockedDetails = {
            tiempoActualUTC: tiempoActual,
            timestampDesbloqueoUTC: 0,
            tiempoRestante: "Permanente",
            fechaDesbloqueo: "No definida",
            esBloqueoPermanente: true,
          };

          return res.status(403).json({
            success: false,
            message:
              "El acceso a profesores y tutores de secundaria está permanentemente bloqueado",
            details: errorDetails,
          });
        }

        // Si solo uno es permanente, priorizamos ese
        if (esProfesorPermanente) {
          const errorDetails: AuthBlockedDetails = {
            tiempoActualUTC: tiempoActual,
            timestampDesbloqueoUTC: timestampProfesorSecundaria,
            tiempoRestante: "Permanente",
            fechaDesbloqueo: "No definida",
            esBloqueoPermanente: true,
          };

          return res.status(403).json({
            success: false,
            message:
              "El acceso para profesores de secundaria está permanentemente bloqueado",
            details: errorDetails,
          });
        }

        if (esTutorPermanente) {
          const errorDetails: AuthBlockedDetails = {
            tiempoActualUTC: tiempoActual,
            timestampDesbloqueoUTC: timestampTutor,
            tiempoRestante: "Permanente",
            fechaDesbloqueo: "No definida",
            esBloqueoPermanente: true,
          };

          return res.status(403).json({
            success: false,
            message: "El acceso para tutores está permanentemente bloqueado",
            details: errorDetails,
          });
        }

        // Si ninguno es permanente, escogemos el que tenga mayor tiempo de bloqueo
        const bloqueoMasLargo =
          timestampProfesorSecundaria > timestampTutor
            ? bloqueoProfesorSecundaria
            : bloqueoTutor;

        const timestampDesbloqueo = Number(
          bloqueoMasLargo.Timestamp_Desbloqueo
        );
        const tiempoRestanteSegundos = timestampDesbloqueo - tiempoActual;
        const horasRestantes = Math.floor(tiempoRestanteSegundos / 3600);
        const minutosRestantes = Math.floor(
          (tiempoRestanteSegundos % 3600) / 60
        );

        // Formatear fecha de desbloqueo
        const fechaDesbloqueo = new Date(timestampDesbloqueo * 1000);
        const fechaFormateada = fechaDesbloqueo.toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const errorDetails: AuthBlockedDetails = {
          tiempoActualUTC: tiempoActual,
          timestampDesbloqueoUTC: timestampDesbloqueo,
          tiempoRestante: `${horasRestantes}h ${minutosRestantes}m`,
          fechaDesbloqueo: fechaFormateada,
          esBloqueoPermanente: false,
        };

        return res.status(403).json({
          success: false,
          message:
            "El acceso a profesores y tutores de secundaria está temporalmente bloqueado",
          details: errorDetails,
        });
      }
      // Si solo está bloqueado el rol de profesor de secundaria
      else if (bloqueoProfesorSecundaria) {
        const timestampDesbloqueo = Number(
          bloqueoProfesorSecundaria.Timestamp_Desbloqueo
        );

        // Determinar si es un bloqueo permanente
        const esBloqueoPermanente =
          timestampDesbloqueo <= 0 || timestampDesbloqueo <= tiempoActual;

        let tiempoRestante = "Permanente";
        let fechaFormateada = "No definida";

        if (!esBloqueoPermanente) {
          const tiempoRestanteSegundos = timestampDesbloqueo - tiempoActual;
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

        const errorDetails: AuthBlockedDetails = {
          tiempoActualUTC: tiempoActual,
          timestampDesbloqueoUTC: timestampDesbloqueo,
          tiempoRestante: tiempoRestante,
          fechaDesbloqueo: fechaFormateada,
          esBloqueoPermanente: esBloqueoPermanente,
        };

        return res.status(403).json({
          success: false,
          message: esBloqueoPermanente
            ? "El acceso para profesores de secundaria está permanentemente bloqueado"
            : "El acceso para profesores de secundaria está temporalmente bloqueado",
          details: errorDetails,
        });
      }
      // Si solo está bloqueado el rol de tutor
      else if (bloqueoTutor) {
        const timestampDesbloqueo = Number(bloqueoTutor.Timestamp_Desbloqueo);

        // Determinar si es un bloqueo permanente
        const esBloqueoPermanente =
          timestampDesbloqueo <= 0 || timestampDesbloqueo <= tiempoActual;

        let tiempoRestante = "Permanente";
        let fechaFormateada = "No definida";

        if (!esBloqueoPermanente) {
          const tiempoRestanteSegundos = timestampDesbloqueo - tiempoActual;
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

        const errorDetails: AuthBlockedDetails = {
          tiempoActualUTC: tiempoActual,
          timestampDesbloqueoUTC: timestampDesbloqueo,
          tiempoRestante: tiempoRestante,
          fechaDesbloqueo: fechaFormateada,
          esBloqueoPermanente: esBloqueoPermanente,
        };

        return res.status(403).json({
          success: false,
          message: esBloqueoPermanente
            ? "El acceso para tutores está permanentemente bloqueado"
            : "El acceso para tutores está temporalmente bloqueado",
          details: errorDetails,
        });
      }
    } catch (error) {
      console.error("Error al verificar bloqueo de rol:", error);
      // No bloqueamos el inicio de sesión por errores en la verificación
    }

    // Buscar el profesor de secundaria por nombre de usuario
    const profesorSecundaria = await prisma.t_Profesores_Secundaria.findUnique({
      where: {
        Nombre_Usuario: Nombre_Usuario,
      },
      select: {
        DNI_Profesor_Secundaria: true,
        Nombre_Usuario: true,
        Contraseña: true,
        Nombres: true,
        Apellidos: true,
        Google_Drive_Foto_ID: true,
        Genero: true,
        Estado: true,
        // Verificar si es tutor mediante la relación con un aula
        aulas: {
          select: {
            Id_Aula: true,
            Nivel: true,
            Grado: true,
            Seccion: true,
            Color: true,
          },
        },
      },
    });

    // Si no existe el profesor de secundaria o las credenciales son incorrectas, retornar error
    if (!profesorSecundaria) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Verificar si la cuenta está activa
    if (!profesorSecundaria.Estado) {
      return res.status(403).json({
        success: false,
        message: "Tu cuenta está inactiva. Contacta al administrador.",
      });
    }

    // Verificar la contraseña
    const isContraseñaValid = verifyProfesorTutorSecundariaPassword(
      Contraseña,
      profesorSecundaria.Contraseña
    );

    if (!isContraseñaValid) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Determinar si es tutor (tiene aula asignada)
    const esTutor = profesorSecundaria.aulas.length > 0;

    // Generar token JWT según el rol
    let token;
    let rol;

    if (esTutor) {
      token = generateTutorToken(
        profesorSecundaria.DNI_Profesor_Secundaria,
        profesorSecundaria.Nombre_Usuario
      );
      rol = RolesSistema.Tutor;
    } else {
      token = generateProfesorSecundariaToken(
        profesorSecundaria.DNI_Profesor_Secundaria,
        profesorSecundaria.Nombre_Usuario
      );
      rol = RolesSistema.ProfesorSecundaria;
    }

    const response: ResponseSuccessLogin = {
      success: true,
      message: "Inicio de sesión exitoso",
      data: {
        Apellidos: profesorSecundaria.Apellidos,
        Nombres: profesorSecundaria.Nombres,
        Rol: rol,
        token,
        Google_Drive_Foto_ID: profesorSecundaria.Google_Drive_Foto_ID,
        Genero: profesorSecundaria.Genero as Genero,
      },
    };

    // Responder con el token y datos básicos del usuario
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error en inicio de sesión:", error);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor, por favor intente más tarde",
    });
  }
}) as any);

export default router;
