import { PrismaClient } from "@prisma/client";
import { ActoresSistema } from "../../../interfaces/shared/ActoresSistema";
import { RolesSistema } from "../../../interfaces/shared/RolesSistema";
import {
  RequestErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
} from "../../../interfaces/shared/apis/errors";
import { deleteFileFromDrive } from "../../../../core/external/google/drive/deleteFileFromDrive";
import { uploadFileToDrive } from "../../../../core/external/google/drive/uploadFileToDrive";

const prisma = new PrismaClient();

/**
 * Sube una foto de perfil para cualquier actor del sistema
 * @param actorTipo Tipo de actor (puede ser RolesSistema o Estudiante)
 * @param file Archivo de imagen a subir
 * @param identificador Identificador único del actor
 * @param nombreArchivo Nombre opcional para el archivo
 * @returns Resultado de la operación de subida
 */
export async function subirFotoPerfil(
  actorTipo: RolesSistema | ActoresSistema.Estudiante,
  file: Express.Multer.File,
  identificador: string | number,
  nombreArchivo?: string
): Promise<{
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  message: string;
  errorType?: any;
}> {
  try {
    // Configuración para cada tipo de actor
    const configuracion = {
      [RolesSistema.Directivo]: {
        modelo: prisma.t_Directivos,
        campo: "Id_Directivo",
        carpeta: "Fotos de Perfil/Directivos",
        esNumerico: true,
        mensaje: "Directivo",
      },
      [RolesSistema.Auxiliar]: {
        modelo: prisma.t_Auxiliares,
        campo: "DNI_Auxiliar",
        carpeta: "Fotos de Perfil/Auxiliares",
        esNumerico: false,
        mensaje: "Auxiliar",
      },
      [RolesSistema.ProfesorPrimaria]: {
        modelo: prisma.t_Profesores_Primaria,
        campo: "DNI_Profesor_Primaria",
        carpeta: "Fotos de Perfil/Profesores Primaria",
        esNumerico: false,
        mensaje: "Profesor de primaria",
      },
      [RolesSistema.ProfesorSecundaria]: {
        modelo: prisma.t_Profesores_Secundaria,
        campo: "DNI_Profesor_Secundaria",
        carpeta: "Fotos de Perfil/Profesores Secundaria",
        esNumerico: false,
        mensaje: "Profesor de secundaria",
      },
      [RolesSistema.Tutor]: {
        modelo: prisma.t_Profesores_Secundaria,
        campo: "DNI_Profesor_Secundaria",
        carpeta: "Fotos de Perfil/Profesores Secundaria",
        esNumerico: false,
        mensaje: "Tutor",
      },
      [RolesSistema.PersonalAdministrativo]: {
        modelo: prisma.t_Personal_Administrativo,
        campo: "DNI_Personal_Administrativo",
        carpeta: "Fotos de Perfil/Personal Administrativo",
        esNumerico: false,
        mensaje: "Personal administrativo",
      },
      [RolesSistema.Responsable]: {
        modelo: prisma.t_Responsables,
        campo: "DNI_Responsable",
        carpeta: "Fotos de Perfil/Responsables",
        esNumerico: false,
        mensaje: "Responsable",
      },
      [ActoresSistema.Estudiante]: {
        modelo: prisma.t_Estudiantes,
        campo: "DNI_Estudiante",
        carpeta: "Fotos de Perfil/Estudiantes",
        esNumerico: false,
        mensaje: "Estudiante",
      },
    };

    // Verificar si el tipo de actor está soportado
    if (!configuracion[actorTipo]) {
      return {
        success: false,
        message: "Tipo de actor no soportado",
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      };
    }

    const config = configuracion[actorTipo];

    // Convertir identificador al tipo adecuado
    const idValor = config.esNumerico
      ? Number(identificador)
      : String(identificador);

    // Buscar al actor
    const actor = await (config.modelo as any).findUnique({
      where: { [config.campo]: idValor },
      select: {
        Google_Drive_Foto_ID: true,
        Nombre_Usuario: actorTipo !== ActoresSistema.Estudiante,
      },
    });

    if (!actor) {
      return {
        success: false,
        message: `${config.mensaje} no encontrado`,
        errorType: UserErrorTypes.USER_NOT_FOUND,
      };
    }

    // Determinar el nombre del archivo
    const extension = file.originalname.split(".").pop() || "png";
    let archivoFinal;

    if (nombreArchivo) {
      // Si se provee un nombre específico, usar ese
      archivoFinal = `${nombreArchivo}.${extension}`;
    } else if (actorTipo === ActoresSistema.Estudiante) {
      // Para estudiantes, usar el DNI
      archivoFinal = `estudiante_${idValor}.${extension}`;
    } else {
      // Para otros roles, usar el nombre de usuario
      archivoFinal = `${actor.Nombre_Usuario}.${extension}`;
    }

    // Eliminar la foto anterior si existe
    if (actor.Google_Drive_Foto_ID) {
      await deleteFileFromDrive(actor.Google_Drive_Foto_ID);
    }

    // Subir la nueva foto
    const resultadoSubida = await uploadFileToDrive(
      file,
      config.carpeta,
      archivoFinal
    );

    // Actualizar el registro en la base de datos
    await (config.modelo as any).update({
      where: { [config.campo]: idValor },
      data: {
        Google_Drive_Foto_ID: resultadoSubida.id,
      },
    });

    // Devolver resultado exitoso
    return {
      success: true,
      message: "Foto de perfil actualizada correctamente",
      fileId: resultadoSubida.id,
      fileUrl: resultadoSubida.webContentLink || resultadoSubida.webViewLink,
    };
  } catch (error) {
    console.error("Error al subir foto de perfil:", error);

    return {
      success: false,
      message: "Error al subir foto de perfil",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
    };
  }
}
