import { Request, Response, Router } from "express";
import multer from "multer";

import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import {
  FileErrorTypes,
  RequestErrorTypes,
  SystemErrorTypes,
  TokenErrorTypes,
} from "../../../../interfaces/shared/errors";
import { RolesTexto } from "../../../../../assets/RolesTextosEspañol";
import { ErrorResponseAPIBase } from "../../../../interfaces/shared/apis/types";
import { validateImageType } from "../../../../lib/helpers/validators/images/validateImageType";
import { validateFileSize } from "../../../../lib/helpers/validators/validateFileSize";
import {
  AuxiliarAuthenticated,
  DirectivoAuthenticated,
  PersonalAdministrativoAuthenticated,
  ProfesorPrimariaAuthenticated,
  ProfesorTutorSecundariaAuthenticated,
} from "../../../../interfaces/shared/JWTPayload";
import { handlePrismaError } from "../../../../lib/helpers/handlers/errors/prisma";

import { CambiarFotoPerfilSuccessResponse } from "../../../../interfaces/shared/apis/shared/mis-datos/mi-foto-perfil/types";
import { subirFotoPerfil } from "../../../../lib/helpers/functions/subirFotoPerfil";

const router = Router();

// Configuración de Multer para almacenamiento en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

router.put("/", upload.single("foto"), (async (req: Request, res: Response) => {
  try {
    const Rol = req.userRole!;
    const userData = req.user!;
    const rdp02EnUso = req.RDP02_INSTANCE!;
    const file = req.file;

    // Verificar que el rol del token coincide con el rol solicitado
    if (req.userRole !== Rol) {
      req.authError = {
        type: TokenErrorTypes.TOKEN_WRONG_ROLE,
        message: `El token no corresponde a un ${RolesTexto[Rol].singular}`,
      };
      return res.status(403).json({
        success: false,
        message: req.authError.message,
        errorType: req.authError.type,
      } as ErrorResponseAPIBase);
    }

    // Verificar que se proporcionó un archivo
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó ninguna imagen",
        errorType: FileErrorTypes.FILE_MISSING,
      } as ErrorResponseAPIBase);
    }

    // Validar el tipo de archivo
    if (!validateImageType(file)) {
      return res.status(400).json({
        success: false,
        message: "El archivo debe ser una imagen válida (JPEG, PNG, GIF, etc.)",
        errorType: FileErrorTypes.INVALID_FILE_TYPE,
      } as ErrorResponseAPIBase);
    }

    // Validar el tamaño del archivo
    if (!validateFileSize(file)) {
      return res.status(400).json({
        success: false,
        message: "El archivo excede el tamaño máximo permitido (5MB)",
        errorType: FileErrorTypes.FILE_TOO_LARGE,
      } as ErrorResponseAPIBase);
    }

    // Obtener el identificador según el rol
    let identificador: string | number;
    switch (Rol) {
      case RolesSistema.Directivo:
        identificador = (userData as DirectivoAuthenticated).Id_Directivo;
        break;
      case RolesSistema.Auxiliar:
        identificador = (userData as AuxiliarAuthenticated).Id_Auxiliar;
        break;
      case RolesSistema.ProfesorPrimaria:
        identificador = (userData as ProfesorPrimariaAuthenticated)
          .Id_Profesor_Primaria;
        break;
      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
        identificador = (userData as ProfesorTutorSecundariaAuthenticated)
          .Id_Profesor_Secundaria;
        break;
      case RolesSistema.PersonalAdministrativo:
        identificador = (userData as PersonalAdministrativoAuthenticated)
          .Id_Personal_Administrativo;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Rol no soportado",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
    }

    // Usar la función centralizada para subir la foto
    const resultado = await subirFotoPerfil(rdp02EnUso,Rol, file, identificador);

    if (!resultado.success) {
      return res.status(404).json({
        success: false,
        message: resultado.message,
        errorType: resultado.errorType,
      } as ErrorResponseAPIBase);
    }

    return res.status(200).json({
      success: true,
      message: resultado.message,
      data: {
        fileId: resultado.fileId,
        fileUrl: resultado.fileUrl,
      },
    } as CambiarFotoPerfilSuccessResponse);
  } catch (error) {
    console.error("Error al actualizar la foto de perfil:", error);

    // Intentar manejar el error con la función específica para errores de Prisma
    const handledError = handlePrismaError(error);
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    return res.status(500).json({
      success: false,
      message: "Error al actualizar la foto de perfil",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details:
        error instanceof Error
          ? { message: error.message }
          : { message: "Error desconocido" },
    } as ErrorResponseAPIBase);
  }
}) as any);

export default router;
