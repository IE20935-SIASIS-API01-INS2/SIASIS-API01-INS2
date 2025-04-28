import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import { ErrorResponseAPIBase } from "../../../../interfaces/shared/apis/types";

import { RolesSistema } from "../../../../interfaces/shared/RolesSistema";
import {
  RequestErrorTypes,
  SystemErrorTypes,
  TokenErrorTypes,
  UserErrorTypes,
  ValidationErrorTypes,
} from "../../../../interfaces/shared/apis/errors";
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

const router = Router();
const prisma = new PrismaClient();

router.put("/", (async (req: Request, res: Response) => {
  try {
    const Rol = req.userRole!;
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

    // Verificar la contraseña actual y generar la nueva contraseña encriptada según el rol
    switch (Rol) {
      case RolesSistema.Directivo: {
        const directivo = await prisma.t_Directivos.findUnique({
          where: {
            Id_Directivo: (userData as DirectivoAuthenticated).Id_Directivo,
          },
          select: {
            Contraseña: true,
          },
        });

        if (!directivo) {
          return res.status(404).json({
            success: false,
            message: "Directivo no encontrado",
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        contraseñaActualValida = verifyDirectivoPassword(
          contraseñaActual,
          directivo.Contraseña
        );
        if (contraseñaActualValida) {
          contraseñaEncriptada = encryptDirectivoPassword(nuevaContraseña);
        }
        break;
      }

      case RolesSistema.Auxiliar: {
        const auxiliar = await prisma.t_Auxiliares.findUnique({
          where: {
            DNI_Auxiliar: (userData as AuxiliarAuthenticated).DNI_Auxiliar,
          },
          select: {
            Contraseña: true,
          },
        });

        if (!auxiliar) {
          return res.status(404).json({
            success: false,
            message: "Auxiliar no encontrado",
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        contraseñaActualValida = verifyAuxiliarPassword(
          contraseñaActual,
          auxiliar.Contraseña
        );
        if (contraseñaActualValida) {
          contraseñaEncriptada = encryptAuxiliarPassword(nuevaContraseña);
        }
        break;
      }

      case RolesSistema.ProfesorPrimaria: {
        const profesor = await prisma.t_Profesores_Primaria.findUnique({
          where: {
            DNI_Profesor_Primaria: (userData as ProfesorPrimariaAuthenticated)
              .DNI_Profesor_Primaria,
          },
          select: {
            Contraseña: true,
          },
        });

        if (!profesor) {
          return res.status(404).json({
            success: false,
            message: "Profesor de primaria no encontrado",
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        contraseñaActualValida = verifyDirectivoPassword(
          contraseñaActual,
          profesor.Contraseña
        );
        if (contraseñaActualValida) {
          contraseñaEncriptada = encryptDirectivoPassword(nuevaContraseña);
        }
        break;
      }

      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor: {
        const profesor = await prisma.t_Profesores_Secundaria.findUnique({
          where: {
            DNI_Profesor_Secundaria: (
              userData as ProfesorTutorSecundariaAuthenticated
            ).DNI_Profesor_Secundaria,
          },
          select: {
            Contraseña: true,
          },
        });

        if (!profesor) {
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
          profesor.Contraseña
        );
        if (contraseñaActualValida) {
          contraseñaEncriptada = encryptDirectivoPassword(nuevaContraseña);
        }
        break;
      }

      case RolesSistema.PersonalAdministrativo: {
        const personal = await prisma.t_Personal_Administrativo.findUnique({
          where: {
            DNI_Personal_Administrativo: (
              userData as PersonalAdministrativoAuthenticated
            ).DNI_Personal_Administrativo,
          },
          select: {
            Contraseña: true,
          },
        });

        if (!personal) {
          return res.status(404).json({
            success: false,
            message: "Personal administrativo no encontrado",
            errorType: UserErrorTypes.USER_NOT_FOUND,
          } as ErrorResponseAPIBase);
        }

        contraseñaActualValida = verifyDirectivoPassword(
          contraseñaActual,
          personal.Contraseña
        );
        if (contraseñaActualValida) {
          contraseñaEncriptada = encryptDirectivoPassword(nuevaContraseña);
        }
        break;
      }

      /* 
        case RolesSistema.Responsable: {
          const responsable = await prisma.t_Responsables.findUnique({
            where: {
              DNI_Responsable: (userData as ResponsableAuthenticated).DNI_Responsable,
            },
            select: {
              Contraseña: true,
            },
          });

          if (!responsable) {
            return res.status(404).json({
              success: false,
              message: "Responsable no encontrado",
              errorType: UserErrorTypes.USER_NOT_FOUND,
            } as ErrorResponseAPIBase);
          }

          contraseñaActualValida = verifyDirectivoPassword(contraseñaActual, responsable.Contraseña);
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
    switch (Rol) {
      case RolesSistema.Directivo:
        await prisma.t_Directivos.update({
          where: {
            Id_Directivo: (userData as DirectivoAuthenticated).Id_Directivo,
          },
          data: {
            Contraseña: contraseñaEncriptada,
          },
        });
        break;

      case RolesSistema.Auxiliar:
        await prisma.t_Auxiliares.update({
          where: {
            DNI_Auxiliar: (userData as AuxiliarAuthenticated).DNI_Auxiliar,
          },
          data: {
            Contraseña: contraseñaEncriptada,
          },
        });
        break;

      case RolesSistema.ProfesorPrimaria:
        await prisma.t_Profesores_Primaria.update({
          where: {
            DNI_Profesor_Primaria: (userData as ProfesorPrimariaAuthenticated)
              .DNI_Profesor_Primaria,
          },
          data: {
            Contraseña: contraseñaEncriptada,
          },
        });
        break;

      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
        await prisma.t_Profesores_Secundaria.update({
          where: {
            DNI_Profesor_Secundaria: (
              userData as ProfesorTutorSecundariaAuthenticated
            ).DNI_Profesor_Secundaria,
          },
          data: {
            Contraseña: contraseñaEncriptada,
          },
        });
        break;

      case RolesSistema.PersonalAdministrativo:
        await prisma.t_Personal_Administrativo.update({
          where: {
            DNI_Personal_Administrativo: (
              userData as PersonalAdministrativoAuthenticated
            ).DNI_Personal_Administrativo,
          },
          data: {
            Contraseña: contraseñaEncriptada,
          },
        });
        break;

      /* 
        case RolesSistema.Responsable:
          await prisma.t_Responsables.update({
            where: {
              DNI_Responsable: (userData as ResponsableAuthenticated).DNI_Responsable,
            },
            data: {
              Contraseña: contraseñaEncriptada,
            },
          });
          break;
        */
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
