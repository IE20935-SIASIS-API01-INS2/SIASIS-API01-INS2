import { Request, Response, Router } from "express";
import { ErrorResponseAPIBase } from "../../../../interfaces/shared/apis/types";

import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import {
  RequestErrorTypes,
  SystemErrorTypes,
  TokenErrorTypes,
  UserErrorTypes,
  ValidationErrorTypes,
} from "../../../../interfaces/shared/errors";
import { RolesTexto } from "../../../../../assets/RolesTextosEspañol";
import {
  AuxiliarAuthenticated,
  DirectivoAuthenticated,
  PersonalAdministrativoAuthenticated,
  ProfesorPrimariaAuthenticated,
  ProfesorTutorSecundariaAuthenticated,
} from "../../../../interfaces/shared/JWTPayload";
import {
  encryptDirectivoPassword,
  verifyDirectivoPassword,
} from "../../../../lib/helpers/encriptations/directivo.encriptation";
import {
  encryptAuxiliarPassword,
  verifyAuxiliarPassword,
} from "../../../../lib/helpers/encriptations/auxiliar.encriptation";
import { handlePrismaError } from "../../../../lib/helpers/handlers/errors/prisma";
import {
  validateCurrentPassword,
  validatePassword,
} from "../../../../lib/helpers/validators/data/validatePassword";
import { ValidatorConfig } from "../../../../lib/helpers/validators/data/types";
import { validateData } from "../../../../lib/helpers/validators/data/validateData";
import {
  CambiarContraseñaRequestBody,
  CambiarContraseñaSuccessResponse,
} from "../../../../interfaces/shared/apis/shared/mis-datos/mi-contraseña/types";
import { buscarContraseñaDirectivo } from "../../../../../core/databases/queries/RDP02/directivos/buscarContraseñaDirectivo";
import { buscarContraseñaPersonalAdministrativo } from "../../../../../core/databases/queries/RDP02/personal-administrativo/buscarContraseñaPersonalAdministrativo";
import { buscarContraseñaAuxiliar } from "../../../../../core/databases/queries/RDP02/auxiliares/buscarContraseñaAuxiliar";
import { buscarContraseñaProfesorPrimaria } from "../../../../../core/databases/queries/RDP02/profesor-primaria/buscarContraseñaProfesorPrimaria";
import { buscarContraseñaProfesorSecundaria } from "../../../../../core/databases/queries/RDP02/profesor-secundaria/buscarContraseñaProfesorSecundaria";
import { actualizarContraseñaAuxiliar } from "../../../../../core/databases/queries/RDP02/auxiliares/actualizarContraseñaAuxiliar";
import { actualizarContraseñaDirectivo } from "../../../../../core/databases/queries/RDP02/directivos/actualizarContraseñaDirectivo";
import { actualizarContraseñaProfesorPrimaria } from "../../../../../core/databases/queries/RDP02/profesor-primaria/actualizarContraseñaProfesorPrimaria";
import { actualizarContraseñaProfesorSecundaria } from "../../../../../core/databases/queries/RDP02/profesor-secundaria/actualizarContraseñaProfesorSecundaria";
import { actualizarContraseñaPersonalAdministrativo } from "../../../../../core/databases/queries/RDP02/personal-administrativo/actualizarContraseñaPersonalAdministrativo";

const router = Router();

router.put("/", (async (req: Request, res: Response) => {
  try {
    const Rol = req.userRole!;
    const rdp02EnUso = req.RDP02_INSTANCE!;
    const userData = req.user!;
    const { contraseñaActual, nuevaContraseña } =
      req.body as CambiarContraseñaRequestBody;

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

    // Configurar validadores
    const validators: ValidatorConfig[] = [
      { field: "contraseñaActual", validator: validateCurrentPassword },
      { field: "nuevaContraseña", validator: validatePassword },
    ];

    // Validar contraseñas
    const validationResult = validateData(
      { contraseñaActual, nuevaContraseña },
      validators
    );

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.errorMessage,
        errorType: validationResult.errorType,
      } as ErrorResponseAPIBase);
    }

    // Si la contraseña actual y la nueva son iguales
    if (contraseñaActual === nuevaContraseña) {
      return res.status(400).json({
        success: false,
        message:
          "La nueva contraseña no puede ser igual a la contraseña actual",
        errorType: ValidationErrorTypes.INVALID_FORMAT,
      } as ErrorResponseAPIBase);
    }

    let contraseñaActualValida = false;
    let contraseñaEncriptada = "";
    let contraseñaAlmacenada: string | null = null;

    // Obtener la contraseña actual según el rol
    switch (Rol) {
      case RolesSistema.Directivo: {
        contraseñaAlmacenada = await buscarContraseñaDirectivo(
          (userData as DirectivoAuthenticated).Id_Directivo,
          rdp02EnUso
        );

        if (!contraseñaAlmacenada) {
          return res.status(404).json({
            success: false,
            message: "Directivo no encontrado",
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        contraseñaActualValida = verifyDirectivoPassword(
          contraseñaActual,
          contraseñaAlmacenada
        );
        if (contraseñaActualValida) {
          contraseñaEncriptada = encryptDirectivoPassword(nuevaContraseña);
        }
        break;
      }

      case RolesSistema.Auxiliar: {
        contraseñaAlmacenada = await buscarContraseñaAuxiliar(
          (userData as AuxiliarAuthenticated).DNI_Auxiliar,
          rdp02EnUso
        );

        if (!contraseñaAlmacenada) {
          return res.status(404).json({
            success: false,
            message: "Auxiliar no encontrado",
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        contraseñaActualValida = verifyAuxiliarPassword(
          contraseñaActual,
          contraseñaAlmacenada
        );
        if (contraseñaActualValida) {
          contraseñaEncriptada = encryptAuxiliarPassword(nuevaContraseña);
        }
        break;
      }

      case RolesSistema.ProfesorPrimaria: {
        contraseñaAlmacenada = await buscarContraseñaProfesorPrimaria(
          (userData as ProfesorPrimariaAuthenticated).DNI_Profesor_Primaria,
          rdp02EnUso
        );

        if (!contraseñaAlmacenada) {
          return res.status(404).json({
            success: false,
            message: "Profesor de primaria no encontrado",
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        contraseñaActualValida = verifyDirectivoPassword(
          contraseñaActual,
          contraseñaAlmacenada
        );
        if (contraseñaActualValida) {
          contraseñaEncriptada = encryptDirectivoPassword(nuevaContraseña);
        }
        break;
      }

      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor: {
        contraseñaAlmacenada = await buscarContraseñaProfesorSecundaria(
          (userData as ProfesorTutorSecundariaAuthenticated)
            .DNI_Profesor_Secundaria,
          rdp02EnUso
        );

        if (!contraseñaAlmacenada) {
          return res.status(404).json({
            success: false,
            message: `${
              Rol === RolesSistema.Tutor ? "Tutor" : "Profesor de secundaria"
            } no encontrado`,
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        contraseñaActualValida = verifyDirectivoPassword(
          contraseñaActual,
          contraseñaAlmacenada
        );
        if (contraseñaActualValida) {
          contraseñaEncriptada = encryptDirectivoPassword(nuevaContraseña);
        }
        break;
      }

      case RolesSistema.PersonalAdministrativo: {
        contraseñaAlmacenada = await buscarContraseñaPersonalAdministrativo(
          (userData as PersonalAdministrativoAuthenticated)
            .DNI_Personal_Administrativo,
          rdp02EnUso
        );

        if (!contraseñaAlmacenada) {
          return res.status(404).json({
            success: false,
            message: "Personal administrativo no encontrado",
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        contraseñaActualValida = verifyDirectivoPassword(
          contraseñaActual,
          contraseñaAlmacenada
        );
        if (contraseñaActualValida) {
          contraseñaEncriptada = encryptDirectivoPassword(nuevaContraseña);
        }
        break;
      }

      /* 
        case RolesSistema.Responsable: {
          contraseñaAlmacenada = await buscarContraseñaResponsable(
            (userData as ResponsableAuthenticated).DNI_Responsable,
            rdp02EnUso
          );

          if (!contraseñaAlmacenada) {
            return res.status(404).json({
              success: false,
              message: "Responsable no encontrado",
              errorType: UserErrorTypes.USER_NOT_FOUND,
            } as ErrorResponseAPIBase);
          }

          contraseñaActualValida = verifyDirectivoPassword(
            contraseñaActual,
            contraseñaAlmacenada
          );
          if (contraseñaActualValida) {
            contraseñaEncriptada = encryptDirectivoPassword(nuevaContraseña);
          }
          break;
        }
        */

      default:
        return res.status(400).json({
          success: false,
          message: "Rol no soportado",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        } as ErrorResponseAPIBase);
    }

    // Verificar si la contraseña actual es válida
    if (!contraseñaActualValida) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual no es correcta",
        errorType: UserErrorTypes.INVALID_CREDENTIALS,
      } as ErrorResponseAPIBase);
    }

    // Actualizar la contraseña en la base de datos según el rol
    let actualizacionExitosa = false;

    switch (Rol) {
      case RolesSistema.Directivo:
        actualizacionExitosa = await actualizarContraseñaDirectivo(
          (userData as DirectivoAuthenticated).Id_Directivo,
          contraseñaEncriptada,
          rdp02EnUso
        );
        break;

      case RolesSistema.Auxiliar:
        actualizacionExitosa = await actualizarContraseñaAuxiliar(
          (userData as AuxiliarAuthenticated).DNI_Auxiliar,
          contraseñaEncriptada,
          rdp02EnUso
        );
        break;

      case RolesSistema.ProfesorPrimaria:
        actualizacionExitosa = await actualizarContraseñaProfesorPrimaria(
          (userData as ProfesorPrimariaAuthenticated).DNI_Profesor_Primaria,
          contraseñaEncriptada,
          rdp02EnUso
        );
        break;

      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
        actualizacionExitosa = await actualizarContraseñaProfesorSecundaria(
          (userData as ProfesorTutorSecundariaAuthenticated)
            .DNI_Profesor_Secundaria,
          contraseñaEncriptada,
          rdp02EnUso
        );
        break;

      case RolesSistema.PersonalAdministrativo:
        actualizacionExitosa = await actualizarContraseñaPersonalAdministrativo(
          (userData as PersonalAdministrativoAuthenticated)
            .DNI_Personal_Administrativo,
          contraseñaEncriptada,
          rdp02EnUso
        );
        break;

      /* 
        case RolesSistema.Responsable:
          actualizacionExitosa = await actualizarContraseñaResponsable(
            (userData as ResponsableAuthenticated).DNI_Responsable,
            contraseñaEncriptada,
            rdp02EnUso
          );
          break;
        */
    }

    if (!actualizacionExitosa) {
      return res.status(500).json({
        success: false,
        message: "Error al actualizar la contraseña",
        errorType: SystemErrorTypes.DATABASE_ERROR,
      } as ErrorResponseAPIBase);
    }

    return res.status(200).json({
      success: true,
      message: "Contraseña actualizada correctamente",
    } as CambiarContraseñaSuccessResponse);
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error);

    // Intentar manejar el error con la función específica para errores de Prisma
    const handledError = handlePrismaError(error);
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    return res.status(500).json({
      success: false,
      message: "Error al cambiar la contraseña",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

export default router;
