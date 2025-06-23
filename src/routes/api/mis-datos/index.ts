import { Request, Response, Router } from "express";

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
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";
import miContraseñaRouter from "./mi-contrasena";
import miFotoDePerfilRouter from "./mi-foto-perfil";
import miCorreoRouter from "./mi-correo";

import {
  RequestErrorTypes,
  SystemErrorTypes,
  TokenErrorTypes,
  UserErrorTypes,
} from "../../../interfaces/shared/errors";

// Importar funciones de consulta a la base de datos
import { buscarDirectivoPorIdSelect } from "../../../../core/databases/queries/RDP02/directivos/buscarDirectivoPorId";
import { buscarAuxiliarPorDNISelect } from "../../../../core/databases/queries/RDP02/auxiliares/buscarAuxiliarPorDNI";
import { buscarProfesorSecundariaPorDNISelect } from "../../../../core/databases/queries/RDP02/profesor-secundaria/buscarProfesorSecundariaPorDNI";

import { buscarPersonalAdministrativoPorDNISelect } from "../../../../core/databases/queries/RDP02/personal-administrativo/buscarPersonalAdministrativoPorDNI";
import { actualizarseAuxiliar } from "../../../../core/databases/queries/RDP02/auxiliares/actualizarseAuxiliar";
import { actualizarseProfesorSecundaria } from "../../../../core/databases/queries/RDP02/profesor-secundaria/actualizarseProfesorSecundaria";
import { actualizarseProfesorPrimaria } from "../../../../core/databases/queries/RDP02/profesor-primaria/actualizarseProfesorPrimaria";
import { actualizarsePersonalAdministrativo } from "../../../../core/databases/queries/RDP02/personal-administrativo/actualizarsePersonalAdministrativo";
import { handleSQLError } from "../../../lib/helpers/handlers/errors/postgreSQL";
import { buscarProfesorPrimariaPorDNIConAula } from "../../../../core/databases/queries/RDP02/profesor-primaria/buscarProfesorPrimariaPorDNIConAula";
import { buscarTutorPorDNIConAula } from "../../../../core/databases/queries/RDP02/profesor-secundaria/buscarTutorPorDNIConAula";
import { actualizarseDirectivo } from "../../../../core/databases/queries/RDP02/directivos/actualizarseDirectivo";

const router = Router();

// Ruta para obtener los datos personales del usuario por rol | Menos Responsable
router.get("/", (async (req: Request, res: Response) => {
  try {
    const Rol = req.userRole!;
    const userData = req.user!;
    const rdp02EnUso = req.RDP02_INSTANCE!;

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
        user = (await buscarDirectivoPorIdSelect(
          (userData as DirectivoAuthenticated).Id_Directivo,
          [
            "Id_Directivo",
            "Nombres",
            "Apellidos",
            "Genero",
            "DNI",
            "Nombre_Usuario",
            "Correo_Electronico",
            "Celular",
            "Google_Drive_Foto_ID",
          ],
          rdp02EnUso
        )) as MisDatosDirectivo;
        break;

      case RolesSistema.Auxiliar:
        user = (await buscarAuxiliarPorDNISelect(
          (userData as AuxiliarAuthenticated).DNI_Auxiliar,
          [
            "DNI_Auxiliar",
            "Nombres",
            "Apellidos",
            "Genero",
            "Nombre_Usuario",
            "Estado",
            "Correo_Electronico",
            "Celular",
            "Google_Drive_Foto_ID",
          ],
          rdp02EnUso
        )) as MisDatosAuxiliar;
        break;

      case RolesSistema.ProfesorPrimaria:
        const profesorPrimaria = await buscarProfesorPrimariaPorDNIConAula(
          (userData as ProfesorPrimariaAuthenticated).DNI_Profesor_Primaria,
          rdp02EnUso
        );

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
        user = (await buscarProfesorSecundariaPorDNISelect(
          (userData as ProfesorTutorSecundariaAuthenticated)
            .DNI_Profesor_Secundaria,
          [
            "DNI_Profesor_Secundaria",
            "Nombres",
            "Apellidos",
            "Genero",
            "Nombre_Usuario",
            "Estado",
            "Correo_Electronico",
            "Celular",
            "Google_Drive_Foto_ID",
          ],
          rdp02EnUso
        )) as MisDatosProfesorSecundaria;
        break;

      case RolesSistema.Tutor:
        // Use the tutorPorDNI function that returns the data with the aula property
        const tutorData = await buscarTutorPorDNIConAula(
          (userData as ProfesorTutorSecundariaAuthenticated)
            .DNI_Profesor_Secundaria,
          rdp02EnUso
        );

        // Only proceed if tutor data was found
        if (tutorData) {
          // Check if the tutor has an aula property and it's not null
          if (!tutorData.aula) {
            // If no aula is found, this person isn't actually a tutor
            return res.status(400).json({
              success: false,
              message: "El usuario no tiene un aula asignada como tutor",
              errorType: UserErrorTypes.USER_ROLE_MISMATCH,
            });
          }

          // Restructure the data to match the expected format
          user = {
            DNI_Profesor_Secundaria: tutorData.DNI_Profesor_Secundaria,
            Nombres: tutorData.Nombres,
            Apellidos: tutorData.Apellidos,
            Genero: tutorData.Genero,
            Nombre_Usuario: tutorData.Nombre_Usuario,
            Estado: tutorData.Estado,
            Correo_Electronico: tutorData.Correo_Electronico,
            Celular: tutorData.Celular,
            Google_Drive_Foto_ID: tutorData.Google_Drive_Foto_ID,
            Aula: {
              Id_Aula: tutorData.aula.Id_Aula,
              Nivel: tutorData.aula.Nivel,
              Grado: tutorData.aula.Grado,
              Seccion: tutorData.aula.Seccion,
              Color: tutorData.aula.Color,
            },
          } as MisDatosTutor;
        }
        break;
      case RolesSistema.PersonalAdministrativo:
        user = (await buscarPersonalAdministrativoPorDNISelect(
          (userData as PersonalAdministrativoAuthenticated)
            .DNI_Personal_Administrativo,
          [
            "DNI_Personal_Administrativo",
            "Nombres",
            "Apellidos",
            "Genero",
            "Nombre_Usuario",
            "Estado",
            "Celular",
            "Google_Drive_Foto_ID",
            "Cargo",
          ],
          rdp02EnUso
        )) as MisDatosPersonalAdministrativo;
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

    // Eliminamos Propiedades innecesarias
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
    const Rol = req.userRole!;
    const userData = req.user!;
    const updateData = req.body;
    const rdp02EnUso = req.RDP02_INSTANCE!;

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
    let updated = false;

    switch (Rol) {
      case RolesSistema.Directivo:
        updated = await actualizarseDirectivo(
          (userData as DirectivoAuthenticated).Id_Directivo,
          updatedFields,
          rdp02EnUso
        );
        break;

      case RolesSistema.Auxiliar:
        updated = await actualizarseAuxiliar(
          (userData as AuxiliarAuthenticated).DNI_Auxiliar,
          updatedFields,
          rdp02EnUso
        );
        break;

      case RolesSistema.ProfesorPrimaria:
        updated = await actualizarseProfesorPrimaria(
          (userData as ProfesorPrimariaAuthenticated).DNI_Profesor_Primaria,
          updatedFields,
          rdp02EnUso
        );
        break;

      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
        updated = await actualizarseProfesorSecundaria(
          (userData as ProfesorTutorSecundariaAuthenticated)
            .DNI_Profesor_Secundaria,
          updatedFields,
          rdp02EnUso
        );
        break;

      case RolesSistema.PersonalAdministrativo:
        updated = await actualizarsePersonalAdministrativo(
          (userData as PersonalAdministrativoAuthenticated)
            .DNI_Personal_Administrativo,
          updatedFields,
          rdp02EnUso
        );
        break;
    }

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado o no se pudo actualizar",
        errorType: UserErrorTypes.USER_NOT_FOUND,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Datos actualizados correctamente",
      data: updatedFields, // Solo devolvemos los campos que realmente se actualizaron
    } as ActualizarUsuarioSuccessResponseAPI01);
  } catch (error) {
    console.error("Error al actualizar datos del usuario:", error);

    // Intentar manejar el error con la función específica para errores SQL
    const handledError = handleSQLError(error, {
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
