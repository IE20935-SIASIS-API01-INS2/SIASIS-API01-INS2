import { ActoresSistema } from "../../../interfaces/shared/ActoresSistema";
import { RolesSistema } from "../../../interfaces/shared/RolesSistema";
import {
  RequestErrorTypes,
  SystemErrorTypes,
  UserErrorTypes,
} from "../../../interfaces/shared/apis/errors";
import { deleteFileFromDrive } from "../../../../core/external/google/drive/deleteFileFromDrive";
import { uploadFileToDrive } from "../../../../core/external/google/drive/uploadFileToDrive";
import { RDP02 } from "../../../interfaces/shared/RDP02Instancias";
import { query } from "../../../../core/databases/connectors/postgres";

/**
 * Sube una foto de perfil para cualquier actor del sistema
 * @param rdp02EnUso Instancia de base de datos a utilizar
 * @param actorTipo Tipo de actor (puede ser RolesSistema o Estudiante)
 * @param file Archivo de imagen a subir
 * @param identificador Identificador único del actor
 * @param nombreArchivo Nombre opcional para el archivo
 * @returns Resultado de la operación de subida
 */
export async function subirFotoPerfil(
  rdp02EnUso: RDP02,
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
        tabla: "T_Directivos",
        campo: "Id_Directivo",
        campoDrive: "Google_Drive_Foto_ID",
        campoUsuario: "Nombre_Usuario",
        carpeta: "Fotos de Perfil/Directivos",
        esNumerico: true,
        mensaje: "Directivo",
      },
      [RolesSistema.Auxiliar]: {
        tabla: "T_Auxiliares",
        campo: "DNI_Auxiliar",
        campoDrive: "Google_Drive_Foto_ID",
        campoUsuario: "Nombre_Usuario",
        carpeta: "Fotos de Perfil/Auxiliares",
        esNumerico: false,
        mensaje: "Auxiliar",
      },
      [RolesSistema.ProfesorPrimaria]: {
        tabla: "T_Profesores_Primaria",
        campo: "DNI_Profesor_Primaria",
        campoDrive: "Google_Drive_Foto_ID",
        campoUsuario: "Nombre_Usuario",
        carpeta: "Fotos de Perfil/Profesores Primaria",
        esNumerico: false,
        mensaje: "Profesor de primaria",
      },
      [RolesSistema.ProfesorSecundaria]: {
        tabla: "T_Profesores_Secundaria",
        campo: "DNI_Profesor_Secundaria",
        campoDrive: "Google_Drive_Foto_ID",
        campoUsuario: "Nombre_Usuario",
        carpeta: "Fotos de Perfil/Profesores Secundaria",
        esNumerico: false,
        mensaje: "Profesor de secundaria",
      },
      [RolesSistema.Tutor]: {
        tabla: "T_Profesores_Secundaria",
        campo: "DNI_Profesor_Secundaria",
        campoDrive: "Google_Drive_Foto_ID",
        campoUsuario: "Nombre_Usuario",
        carpeta: "Fotos de Perfil/Profesores Secundaria",
        esNumerico: false,
        mensaje: "Tutor",
      },
      [RolesSistema.PersonalAdministrativo]: {
        tabla: "T_Personal_Administrativo",
        campo: "DNI_Personal_Administrativo",
        campoDrive: "Google_Drive_Foto_ID",
        campoUsuario: "Nombre_Usuario",
        carpeta: "Fotos de Perfil/Personal Administrativo",
        esNumerico: false,
        mensaje: "Personal administrativo",
      },
      [RolesSistema.Responsable]: {
        tabla: "T_Responsables",
        campo: "DNI_Responsable",
        campoDrive: "Google_Drive_Foto_ID",
        campoUsuario: "Nombre_Usuario",
        carpeta: "Fotos de Perfil/Responsables",
        esNumerico: false,
        mensaje: "Responsable",
      },
      [ActoresSistema.Estudiante]: {
        tabla: "T_Estudiantes",
        campo: "DNI_Estudiante",
        campoDrive: "Google_Drive_Foto_ID",
        campoUsuario: "",
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

    // Construir la consulta SQL
    let campos = [config.campoDrive];
    if (actorTipo !== ActoresSistema.Estudiante) {
      campos.push(config.campoUsuario);
    }
    
    const camposStr = campos.map(campo => `"${campo}"`).join(", ");
    
    // Buscar al actor
    const sql = `
      SELECT ${camposStr}
      FROM "${config.tabla}"
      WHERE "${config.campo}" = $1
    `;
    
    const result = await query(
      rdp02EnUso,
      sql,
      [idValor]
    );
    
    if (result.rows.length === 0) {
      return {
        success: false,
        message: `${config.mensaje} no encontrado`,
        errorType: UserErrorTypes.USER_NOT_FOUND,
      };
    }
    
    const actor = result.rows[0];

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
      archivoFinal = `${actor[config.campoUsuario]}.${extension}`;
    }

    // Eliminar la foto anterior si existe
    if (actor[config.campoDrive]) {
      await deleteFileFromDrive(actor[config.campoDrive]);
    }

    // Subir la nueva foto
    const resultadoSubida = await uploadFileToDrive(
      file,
      config.carpeta,
      archivoFinal
    );

    // Actualizar el registro en la base de datos usando SQL
    const updateSql = `
      UPDATE "${config.tabla}"
      SET "${config.campoDrive}" = $1
      WHERE "${config.campo}" = $2
    `;
    
    const updateResult = await query(
      rdp02EnUso,
      updateSql,
      [resultadoSubida.id, idValor]
    );
    
    if (updateResult.rowCount === 0) {
      return {
        success: false,
        message: `Error al actualizar la foto del ${config.mensaje.toLowerCase()}`,
        errorType: SystemErrorTypes.DATABASE_ERROR,
      };
    }

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