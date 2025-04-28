import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";

import { RolesSistema } from "../../../interfaces/shared/RolesSistema";
import {
  AuxiliarAuthenticated,
  DirectivoAuthenticated,
  ProfesorPrimariaAuthenticated,
  ProfesorTutorSecundariaAuthenticated,
  // ResponsableAuthenticated,
  PersonalAdministrativoAuthenticated,
} from "../../../interfaces/shared/JWTPayload";

import { RolesTexto } from "../../../../assets/RolesTextosEspañol";

import {
  ActualizarUsuarioSuccessResponseAPI01,
  MisDatosDirectivo,
  MisDatosErrorResponseAPI01,
  MisDatosPersonalAdministrativo,
  MisDatosProfesorPrimaria,
  MisDatosProfesorSecundaria,
  MisDatosSuccessResponseAPI01,
  MisDatosTutor,
  ObtenerMisDatosSuccessAPI01Data,
} from "../../../interfaces/shared/apis/api01/mis-datos/types";

import { MisDatosAuxiliar } from "../../../interfaces/shared/apis/api01/mis-datos/types";
import { validateDNI } from "../../../lib/helpers/validators/data/validateDNI";
import { validateNames } from "../../../lib/helpers/validators/data/validateNombres";
import { validateLastNames } from "../../../lib/helpers/validators/data/validateApellidos";
import { validateGender } from "../../../lib/helpers/validators/data/validateGenero";
import { validatePhone } from "../../../lib/helpers/validators/data/validateCelular";
import { ValidatorConfig } from "../../../lib/helpers/validators/data/types";
import { validateEmail } from "../../../lib/helpers/validators/data/validateCorreo";
import { validateData } from "../../../lib/helpers/validators/data/validateData";
import { handlePrismaError } from "../../../lib/helpers/handlers/errors/prisma";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";
import miContraseñaRouter from "./mi-contrasena";
import miFotoDePerfilRouter from "./mi-foto-perfil";
import miCorreoRouter from "./mi-correo";

import {
  RequestErrorTypes,
  SystemErrorTypes,
  TokenErrorTypes,
  UserErrorTypes,
} from "../../../interfaces/shared/apis/errors";

const router = Router();
const prisma = new PrismaClient();

// Ruta para obtener los datos personales del usuario por rol | Menos Responsable
router.get("/", (async (req: Request, res: Response) => {
  try {
    const Rol  = req.userRole!;
    const userData = req.user!;

    // Buscar el usuario correspondiente según el rol
    let user: ObtenerMisDatosSuccessAPI01Data | null = null;

    if (req.userRole !== Rol) {
      req.authError = {
        type: TokenErrorTypes.TOKEN_WRONG_ROLE,
        message: `El token no corresponde a un ${RolesTexto[Rol].singular}`,
      };
      return res.status(403).json({
        success: false,
        message: req.authError.message,
        errorType: req.authError.type,
      });
    }

    switch (Rol) {
      case RolesSistema.Directivo:
        user = (await prisma.t_Directivos.findUnique({
          where: {
            Id_Directivo: (userData as DirectivoAuthenticated).Id_Directivo,
          },
          select: {
            Id_Directivo: true,
            Nombres: true,
            Apellidos: true,
            Genero: true,
            DNI: true,
            Nombre_Usuario: true,
            Correo_Electronico: true,
            Celular: true,
            Google_Drive_Foto_ID: true,
          },
        })) as MisDatosDirectivo;
        break;

      case RolesSistema.Auxiliar:
        user = (await prisma.t_Auxiliares.findUnique({
          where: {
            DNI_Auxiliar: (userData as AuxiliarAuthenticated).DNI_Auxiliar,
          },
          select: {
            DNI_Auxiliar: true,
            Nombres: true,
            Apellidos: true,
            Genero: true,
            Nombre_Usuario: true,
            Estado: true,
            Correo_Electronico: true,
            Celular: true,
            Google_Drive_Foto_ID: true,
          },
        })) as MisDatosAuxiliar;
        break;

      case RolesSistema.ProfesorPrimaria:
        const profesorPrimaria = await prisma.t_Profesores_Primaria.findUnique({
          where: {
            DNI_Profesor_Primaria: (userData as ProfesorPrimariaAuthenticated)
              .DNI_Profesor_Primaria,
          },
          select: {
            DNI_Profesor_Primaria: true,
            Nombres: true,
            Apellidos: true,
            Genero: true,
            Nombre_Usuario: true,
            Estado: true,
            Correo_Electronico: true,
            Celular: true,
            Google_Drive_Foto_ID: true,
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

        // Modificar la estructura para tener una propiedad Aula simple
        if (profesorPrimaria) {
          // Asumiendo que solo tienen un aula asignada
          const aula =
            profesorPrimaria.aulas && profesorPrimaria.aulas.length > 0
              ? profesorPrimaria.aulas[0]
              : null;
          user = {
            ...profesorPrimaria,
            Aula: aula,
            aulas: undefined, // Remover la propiedad aulas original
          } as MisDatosProfesorPrimaria;
        }
        break;

      case RolesSistema.ProfesorSecundaria:
        user = (await prisma.t_Profesores_Secundaria.findUnique({
          where: {
            DNI_Profesor_Secundaria: (
              userData as ProfesorTutorSecundariaAuthenticated
            ).DNI_Profesor_Secundaria,
          },
          select: {
            DNI_Profesor_Secundaria: true,
            Nombres: true,
            Apellidos: true,
            Genero: true,
            Nombre_Usuario: true,
            Estado: true,
            Correo_Electronico: true,
            Celular: true,
            Google_Drive_Foto_ID: true,
          },
        })) as MisDatosProfesorSecundaria;
        break;

      case RolesSistema.Tutor:
        const tutor = await prisma.t_Profesores_Secundaria.findUnique({
          where: {
            DNI_Profesor_Secundaria: (
              userData as ProfesorTutorSecundariaAuthenticated
            ).DNI_Profesor_Secundaria,
          },
          select: {
            DNI_Profesor_Secundaria: true,
            Nombres: true,
            Apellidos: true,
            Genero: true,
            Nombre_Usuario: true,
            Estado: true,
            Correo_Electronico: true,
            Celular: true,
            Google_Drive_Foto_ID: true,
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

        // Modificar la estructura para tener una propiedad Aula simple
        if (tutor) {
          // Asumiendo que solo tienen un aula asignada
          const aula =
            tutor.aulas && tutor.aulas.length > 0 ? tutor.aulas[0] : null;
          user = {
            ...tutor,
            Aula: aula!,
          } as MisDatosTutor;
        }
        break;

      // case RolesSistema.Responsable:
      //   user = await prisma.t_Responsables.findUnique({
      //     where: {
      //       DNI_Responsable: (userData as ResponsableAuthenticated)
      //         .DNI_Responsable,
      //     },
      //     select: {
      //       DNI_Responsable: true,
      //       Nombres: true,
      //       Apellidos: true,
      //       Nombre_Usuario: true,
      //       Celular: true,
      //       Google_Drive_Foto_ID: true,
      //     },
      //   });
      //   break;

      case RolesSistema.PersonalAdministrativo:
        user = (await prisma.t_Personal_Administrativo.findUnique({
          where: {
            DNI_Personal_Administrativo: (
              userData as PersonalAdministrativoAuthenticated
            ).DNI_Personal_Administrativo,
          },
          select: {
            DNI_Personal_Administrativo: true,
            Nombres: true,
            Apellidos: true,
            Genero: true,
            Nombre_Usuario: true,
            Estado: true,
            Celular: true,
            Google_Drive_Foto_ID: true,
            // Incluir horarios laborales para personal administrativo
            Horario_Laboral_Entrada: true,
            Horario_Laboral_Salida: true,
            Cargo: true,
          },
        })) as MisDatosPersonalAdministrativo;

        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Rol no soportado",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
        errorType: UserErrorTypes.USER_NOT_FOUND,
      });
    }

    //Eliminamos Propiedades innecesarias
    delete (user as any).aulas;

    return res.status(200).json({
      success: true,
      data: user,
    } as MisDatosSuccessResponseAPI01);
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los datos del usuario",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as MisDatosErrorResponseAPI01);
  }
}) as any);

// Ruta para actualizar parcialmente los datos personales del usuario por rol | Menos Responsable
router.put("/", (async (req: Request, res: Response) => {
  try {
    const Rol  = req.userRole!;
    const userData = req.user!;
    const updateData = req.body;

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
      });
    }

    // Verificar que se ha enviado al menos un campo para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar al menos un campo para actualizar",
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      });
    }

    let validators: ValidatorConfig[] = [];
    let updatedFields: any = {};

    // Configurar validadores según el rol
    switch (Rol) {
      case RolesSistema.Directivo:
        validators = [
          { field: "DNI", validator: validateDNI },
          { field: "Nombres", validator: validateNames },
          { field: "Apellidos", validator: validateLastNames },
          { field: "Genero", validator: validateGender },
          { field: "Celular", validator: validatePhone },
        ];
        break;

      case RolesSistema.ProfesorPrimaria:
      case RolesSistema.ProfesorSecundaria:
        validators = [
          { field: "Celular", validator: validatePhone },
          { field: "Correo_Electronico", validator: validateEmail },
        ];
        break;

      case RolesSistema.Tutor:
        validators = [{ field: "Celular", validator: validatePhone }];
        break;

      case RolesSistema.Auxiliar:
        validators = [
          { field: "Celular", validator: validatePhone },
          { field: "Correo_Electronico", validator: validateEmail },
        ];
        break;

      case RolesSistema.PersonalAdministrativo:
        validators = [{ field: "Celular", validator: validatePhone }];
        break;

      /* 
        case RolesSistema.Responsable:
          validators = [
            { field: 'Celular', validator: validatePhone }
          ];
          break;
        */

      default:
        return res.status(400).json({
          success: false,
          message: "Rol no soportado",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        });
    }

    // Filtrar solo los campos permitidos
    const allowedFields = validators.map((v) => v.field);
    for (const key in updateData) {
      if (allowedFields.includes(key)) {
        updatedFields[key] = updateData[key];
      }
    }

    // Verificar que hay al menos un campo para actualizar
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: `No se proporcionaron campos válidos para actualizar. Campos permitidos: ${allowedFields.join(
          ", "
        )}`,
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      });
    }

    // Usar la función validateData para validar todos los campos de una vez
    const validationResult = validateData(updatedFields, validators);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.errorMessage,
        errorType: validationResult.errorType,
      });
    }

    // Ahora que los datos están validados, podemos proceder con la actualización
    switch (Rol) {
      case RolesSistema.Directivo:
        await prisma.t_Directivos.update({
          where: {
            Id_Directivo: (userData as DirectivoAuthenticated).Id_Directivo,
          },
          data: updatedFields,
        });
        break;

      case RolesSistema.Auxiliar:
        await prisma.t_Auxiliares.update({
          where: {
            DNI_Auxiliar: (userData as AuxiliarAuthenticated).DNI_Auxiliar,
          },
          data: updatedFields,
        });
        break;

      case RolesSistema.ProfesorPrimaria:
        await prisma.t_Profesores_Primaria.update({
          where: {
            DNI_Profesor_Primaria: (userData as ProfesorPrimariaAuthenticated)
              .DNI_Profesor_Primaria,
          },
          data: updatedFields,
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
          data: updatedFields,
        });
        break;

      /* 
        case RolesSistema.Responsable:
          await prisma.t_Responsables.update({
            where: {
              DNI_Responsable: (userData as ResponsableAuthenticated).DNI_Responsable,
            },
            data: updatedFields,
          });
          break;
        */

      case RolesSistema.PersonalAdministrativo:
        await prisma.t_Personal_Administrativo.update({
          where: {
            DNI_Personal_Administrativo: (
              userData as PersonalAdministrativoAuthenticated
            ).DNI_Personal_Administrativo,
          },
          data: updatedFields,
        });
        break;
    }

    return res.status(200).json({
      success: true,
      message: "Datos actualizados correctamente",
      data: updatedFields, // Solo devolvemos los campos que realmente se actualizaron
    } as ActualizarUsuarioSuccessResponseAPI01);
  } catch (error) {
    console.error("Error al actualizar datos del usuario:", error);

    // Intentar manejar el error con la función específica para errores de Prisma
    const handledError = handlePrismaError(error, {
      DNI: "DNI",
      Correo_Electronico: "correo electrónico",
      DNI_Auxiliar: "DNI",
      DNI_Profesor_Primaria: "DNI",
      DNI_Profesor_Secundaria: "DNI",
      DNI_Personal_Administrativo: "DNI",
    });
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    // Si no fue manejado, devolver un error genérico
    return res.status(500).json({
      success: false,
      message: "Error al actualizar los datos del usuario",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

router.use("/mi-contrasena", miContraseñaRouter);
router.use("/mi-foto-perfil", miFotoDePerfilRouter);
router.use("/mi-correo", miCorreoRouter);

export default router;
