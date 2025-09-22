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

import { validateIdentificadorDeUsuario } from "../../../lib/helpers/validators/data/validateIdentificadorDeUsuario";
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

// 🗄️ Importar funciones de consulta a la base de datos
import { buscarDirectivoPorIdSelect } from "../../../../core/databases/queries/RDP02/directivos/buscarDirectivoPorId";
import { buscarAuxiliarPorIdSelect } from "../../../../core/databases/queries/RDP02/auxiliares/buscarAuxiliarPorId";
import { buscarProfesorSecundariaPorIdSelect } from "../../../../core/databases/queries/RDP02/profesor-secundaria/buscarProfesorSecundariaPorId";
import { buscarPersonalAdministrativoPorIdSelect } from "../../../../core/databases/queries/RDP02/personal-administrativo/buscarPersonalAdministrativoPorId";

// 💾 Importar funciones de actualización a la base de datos
import { actualizarseAuxiliar } from "../../../../core/databases/queries/RDP02/auxiliares/actualizarseAuxiliar";
import { actualizarseProfesorSecundaria } from "../../../../core/databases/queries/RDP02/profesor-secundaria/actualizarseProfesorSecundaria";
import { actualizarseProfesorPrimaria } from "../../../../core/databases/queries/RDP02/profesor-primaria/actualizarseProfesorPrimaria";
import { actualizarsePersonalAdministrativo } from "../../../../core/databases/queries/RDP02/personal-administrativo/actualizarsePersonalAdministrativo";
import { actualizarseDirectivo } from "../../../../core/databases/queries/RDP02/directivos/actualizarseDirectivo";

// 🏫 Importar funciones especiales para usuarios con aulas
import { buscarProfesorPrimariaPorIdConAula } from "../../../../core/databases/queries/RDP02/profesor-primaria/buscarProfesorPrimariaPorIdConAula";
import { buscarTutorPorIdConAula } from "../../../../core/databases/queries/RDP02/profesor-secundaria/buscarTutorPorIdConAula";

// 🚨 Importar manejador de errores SQL
import { handleSQLError } from "../../../lib/helpers/handlers/errors/postgreSQL";

const router = Router();

// 📋 RUTA GET: Obtener los datos personales del usuario por rol | Excluye Responsables
router.get("/", (async (req: Request, res: Response) => {
  try {
    const Rol = req.userRole!;
    const userData = req.user!;
    const rdp02EnUso = req.RDP02_INSTANCE!;

    // 🔍 Variable para almacenar los datos del usuario encontrado
    let user: ObtenerMisDatosSuccessAPI01Data | null = null;

    // 🔐 Verificar que el rol del token coincide con el rol solicitado
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

    // 🎯 Buscar datos específicos según el rol del usuario autenticado
    switch (Rol) {
      case RolesSistema.Directivo:
        // ✅ Para Directivos: Incluye Identificador_Nacional (formato nuevo con guión)
        user = (await buscarDirectivoPorIdSelect(
          (userData as DirectivoAuthenticated).Id_Directivo,
          [
            "Id_Directivo",
            "Nombres",
            "Apellidos",
            "Genero",
            "Identificador_Nacional", 
            "Nombre_Usuario",
            "Correo_Electronico",
            "Celular",
            "Google_Drive_Foto_ID",
          ],
          rdp02EnUso
        )) as MisDatosDirectivo;
        break;

      case RolesSistema.Auxiliar:
        // ✅ Para Auxiliares: Usar Id_Auxiliar (formato nuevo de identificador)
        user = (await buscarAuxiliarPorIdSelect(
          (userData as AuxiliarAuthenticated).Id_Auxiliar,
          [
            "Id_Auxiliar",
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
        // ✅ Para Profesores de Primaria: Incluye información del aula asignada
        const profesorPrimaria = await buscarProfesorPrimariaPorIdConAula(
          (userData as ProfesorPrimariaAuthenticated).Id_Profesor_Primaria,
          rdp02EnUso
        );

        // 🏫 Transformar la estructura para tener una propiedad Aula simple
        if (profesorPrimaria) {
          // 📝 Los profesores de primaria tienen máximo un aula asignada
          const aula =
            profesorPrimaria.aulas && profesorPrimaria.aulas.length > 0
              ? profesorPrimaria.aulas[0]
              : null;
          user = {
            ...profesorPrimaria,
            Aula: aula,
            aulas: undefined, // 🗑️ Remover la propiedad aulas original del resultado
          } as MisDatosProfesorPrimaria;
        }
        break;

      case RolesSistema.ProfesorSecundaria:
        // ✅ Para Profesores de Secundaria: Sin aula específica asignada
        user = (await buscarProfesorSecundariaPorIdSelect(
          (userData as ProfesorTutorSecundariaAuthenticated)
            .Id_Profesor_Secundaria,
          [
            "Id_Profesor_Secundaria",
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
        // ✅ Para Tutores: Profesor de secundaria CON aula específica asignada
        const tutorData = await buscarTutorPorIdConAula(
          (userData as ProfesorTutorSecundariaAuthenticated)
            .Id_Profesor_Secundaria,
          rdp02EnUso
        );

        // 🔍 Solo proceder si se encontraron datos del tutor
        if (tutorData) {
          // ✅ Verificar que el tutor tiene un aula asignada (requisito para ser tutor)
          if (!tutorData.aula) {
            // ❌ Si no hay aula asignada, esta persona no es realmente un tutor
            return res.status(400).json({
              success: false,
              message: "El usuario no tiene un aula asignada como tutor",
              errorType: UserErrorTypes.USER_ROLE_MISMATCH,
            });
          }

          // 🏗️ Reestructurar los datos para que coincidan con el formato esperado
          user = {
            Id_Profesor_Secundaria: tutorData.Id_Profesor_Secundaria,
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
        // ✅ Para Personal Administrativo: Incluye cargo específico del empleado
        user = (await buscarPersonalAdministrativoPorIdSelect(
          (userData as PersonalAdministrativoAuthenticated)
            .Id_Personal_Administrativo,
          [
            "Id_Personal_Administrativo",
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
        // ❌ Rol no soportado en este endpoint
        return res.status(400).json({
          success: false,
          message: "Rol no soportado",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        });
    }

    // ❌ Verificar si se encontró el usuario en la base de datos
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
        errorType: UserErrorTypes.USER_NOT_FOUND,
      });
    }

    // 🧹 Limpiar propiedades innecesarias que puedan haber quedado
    delete (user as any).aulas;

    // ✅ Respuesta exitosa con los datos del usuario
    return res.status(200).json({
      success: true,
      data: user,
    } as MisDatosSuccessResponseAPI01);

  } catch (error) {
    // 🚨 Manejo de errores generales durante la consulta
    console.error("Error al obtener datos del usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los datos del usuario",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as MisDatosErrorResponseAPI01);
  }
}) as any);

// ✏️ RUTA PUT: Actualizar parcialmente los datos personales del usuario por rol | Excluye Responsables
router.put("/", (async (req: Request, res: Response) => {
  try {
    const Rol = req.userRole!;
    const userData = req.user!;
    const updateData = req.body;
    const rdp02EnUso = req.RDP02_INSTANCE!;

    // 🔐 Verificar que el rol del token coincide con el rol solicitado
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

    // ✅ Verificar que se ha enviado al menos un campo para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar al menos un campo para actualizar",
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      });
    }

    // 🎯 Variables para configurar validaciones y campos permitidos
    let validators: ValidatorConfig[] = [];
    let updatedFields: any = {};

    // 🎯 Configurar validadores específicos según el rol del usuario
    switch (Rol) {
      case RolesSistema.Directivo:
        
        validators = [
          { field: "Identificador_Nacional", validator: validateIdentificadorDeUsuario }, // ✅ Campo actualizado
          { field: "Nombres", validator: validateNames },
          { field: "Apellidos", validator: validateLastNames },
          { field: "Genero", validator: validateGender },
          { field: "Celular", validator: validatePhone },
        ];
        break;

      case RolesSistema.ProfesorPrimaria:
      case RolesSistema.ProfesorSecundaria:
        // ✅ Profesores pueden actualizar celular y correo electrónico
        validators = [
          { field: "Celular", validator: validatePhone },
          { field: "Correo_Electronico", validator: validateEmail },
        ];
        break;

      case RolesSistema.Tutor:
        // ✅ Tutores solo pueden actualizar su número de celular
        validators = [{ field: "Celular", validator: validatePhone }];
        break;

      case RolesSistema.Auxiliar:
        // ✅ Auxiliares pueden actualizar celular y correo electrónico
        validators = [
          { field: "Celular", validator: validatePhone },
          { field: "Correo_Electronico", validator: validateEmail },
        ];
        break;

      case RolesSistema.PersonalAdministrativo:
        // ✅ Personal administrativo solo puede actualizar su celular
        validators = [{ field: "Celular", validator: validatePhone }];
        break;

      default:
        // ❌ Rol no soportado para actualización
        return res.status(400).json({
          success: false,
          message: "Rol no soportado",
          errorType: RequestErrorTypes.INVALID_PARAMETERS,
        });
    }

    // 🔍 Filtrar solo los campos permitidos para este rol específico
    const allowedFields = validators.map((v) => v.field);
    for (const key in updateData) {
      if (allowedFields.includes(key)) {
        updatedFields[key] = updateData[key];
      }
    }

    // ✅ Verificar que hay al menos un campo válido para actualizar
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: `No se proporcionaron campos válidos para actualizar. Campos permitidos: ${allowedFields.join(
          ", "
        )}`,
        errorType: RequestErrorTypes.INVALID_PARAMETERS,
      });
    }

    // 🛡️ Usar la función validateData para validar todos los campos enviados
    const validationResult = validateData(updatedFields, validators);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.errorMessage,
        errorType: validationResult.errorType,
      });
    }

    // 💾 Variable para verificar si la actualización fue exitosa
    let updated = false;

    // 🎯 Realizar actualización específica según el rol del usuario
    switch (Rol) {
      case RolesSistema.Directivo:
        // ✅ Actualizar datos de directivo usando su ID único
        updated = await actualizarseDirectivo(
          (userData as DirectivoAuthenticated).Id_Directivo,
          updatedFields,
          rdp02EnUso
        );
        break;

      case RolesSistema.Auxiliar:
        // ✅ Actualizar datos de auxiliar usando su identificador
        updated = await actualizarseAuxiliar(
          (userData as AuxiliarAuthenticated).Id_Auxiliar,
          updatedFields,
          rdp02EnUso
        );
        break;

      case RolesSistema.ProfesorPrimaria:
        // ✅ Actualizar datos de profesor de primaria
        updated = await actualizarseProfesorPrimaria(
          (userData as ProfesorPrimariaAuthenticated).Id_Profesor_Primaria,
          updatedFields,
          rdp02EnUso
        );
        break;

      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
        // ✅ Actualizar datos de profesor de secundaria o tutor (ambos usan la misma tabla)
        updated = await actualizarseProfesorSecundaria(
          (userData as ProfesorTutorSecundariaAuthenticated)
            .Id_Profesor_Secundaria,
          updatedFields,
          rdp02EnUso
        );
        break;

      case RolesSistema.PersonalAdministrativo:
        // ✅ Actualizar datos de personal administrativo
        updated = await actualizarsePersonalAdministrativo(
          (userData as PersonalAdministrativoAuthenticated)
            .Id_Personal_Administrativo,
          updatedFields,
          rdp02EnUso
        );
        break;
    }

    // ❌ Verificar si la actualización fue exitosa
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado o no se pudo actualizar",
        errorType: UserErrorTypes.USER_NOT_FOUND,
      });
    }

    // ✅ Respuesta exitosa con los campos que fueron actualizados
    return res.status(200).json({
      success: true,
      message: "Datos actualizados correctamente",
      data: updatedFields, // Solo devolvemos los campos que realmente se actualizaron
    } as ActualizarUsuarioSuccessResponseAPI01);

  } catch (error) {
    // 🚨 Manejo de errores durante la actualización
    console.error("Error al actualizar datos del usuario:", error);

    // 🔧 ACTUALIZADO: Intentar manejar errores SQL específicos con nombres de campos actualizados
    const handledError = handleSQLError(error, {
      Identificador_Nacional: "identificador nacional", 
      Correo_Electronico: "correo electrónico",
      Id_Auxiliar: "identificador", 
      Id_Profesor_Primaria: "identificador", 
      Id_Profesor_Secundaria: "identificador", 
      Id_Personal_Administrativo: "identificador", 
    });
    
    // 💥 Si el error fue manejado específicamente, devolver la respuesta personalizada
    if (handledError) {
      return res.status(handledError.status).json(handledError.response);
    }

    // 🚨 Si no fue manejado por la función específica, devolver error genérico
    return res.status(500).json({
      success: false,
      message: "Error al actualizar los datos del usuario",
      errorType: SystemErrorTypes.UNKNOWN_ERROR,
      details: error,
    } as ErrorResponseAPIBase);
  }
}) as any);

// 🔗 Incluir sub-routers para funcionalidades específicas de usuario
router.use("/mi-contrasena", miContraseñaRouter); // 🔑 Gestión de contraseñas de usuario
router.use("/mi-foto-perfil", miFotoDePerfilRouter); // 📸 Gestión de fotos de perfil
router.use("/mi-correo", miCorreoRouter); // 📧 Gestión de correos electrónicos

export default router;