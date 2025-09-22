import {
  DirectivoGenerico,
  AuxiliarGenerico,
  ProfesorPrimariaGenerico,
  ProfesorSecundariaGenerico,
  GenericUser,
  TutorGenerico,
  PersonalAdministrativoGenerico,
} from "../../../../../src/interfaces/shared/GenericUser";
import { Genero } from "../../../../../src/interfaces/shared/Genero";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { RolesSistema } from "../../../../../src/interfaces/shared/RolesSistema";
import { query } from "../../../connectors/postgres";

/**
 * Busca directivo por Identificador Nacional para datos genéricos - ACTUALIZADA
 */
export async function buscarDirectivoPorIdentificadorNacionalGenerico(
  identificadorNacional: string,
  instanciaEnUso?: RDP02
): Promise<DirectivoGenerico | null> {
  const sql = `
    SELECT
      "Id_Directivo",
      "Identificador_Nacional",
      "Nombres",
      "Apellidos", 
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Directivos"
    WHERE "Identificador_Nacional" = $1
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [identificadorNacional]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as DirectivoGenerico;
}

/**
 * Busca directivo por ID para datos genéricos - ACTUALIZADA
 */
export async function buscarDirectivoPorIDGenerico(
  id: number,
  instanciaEnUso?: RDP02
): Promise<DirectivoGenerico | null> {
  const sql = `
    SELECT
      "Id_Directivo",
      "Identificador_Nacional",
      "Nombres",
      "Apellidos", 
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Directivos"
    WHERE "Id_Directivo" = $1
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as DirectivoGenerico;
}

/**
 * Busca auxiliar por ID para datos genéricos - ACTUALIZADA
 */
export async function buscarAuxiliarPorIdGenerico(
  id: string,
  instanciaEnUso?: RDP02
): Promise<AuxiliarGenerico | null> {
  const sql = `
    SELECT 
      "Id_Auxiliar",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Auxiliares"
    WHERE "Id_Auxiliar" = $1 AND "Estado" = true
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as AuxiliarGenerico;
}

/**
 * Busca profesor de primaria por Id para datos genéricos - ACTUALIZADA
 */
export async function buscarProfesorPrimariaPorIdGenerico(
  id: string,
  instanciaEnUso?: RDP02
): Promise<ProfesorPrimariaGenerico | null> {
  const sql = `
    SELECT 
      "Id_Profesor_Primaria",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Profesores_Primaria"
    WHERE "Id_Profesor_Primaria" = $1 AND "Estado" = true
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as ProfesorPrimariaGenerico;
}

/**
 * Busca profesor de secundaria por ID para datos genéricos - ACTUALIZADA
 */
export async function buscarProfesorSecundariaPorIdGenerico(
  id: string,
  instanciaEnUso?: RDP02
): Promise<ProfesorSecundariaGenerico | null> {
  const sql = `
    SELECT 
      "Id_Profesor_Secundaria",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Profesores_Secundaria"
    WHERE "Id_Profesor_Secundaria" = $1 AND "Estado" = true
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as ProfesorSecundariaGenerico;
}

/**
 * Busca tutor (profesor secundaria con aula) por Id para datos genéricos - ACTUALIZADA
 */
export async function buscarTutorPorIdGenerico(
  id: string,
  instanciaEnUso?: RDP02
): Promise<TutorGenerico | null> {
  const sql = `
    SELECT 
      p."Id_Profesor_Secundaria",
      p."Nombres",
      p."Apellidos",
      p."Genero",
      p."Google_Drive_Foto_ID"
    FROM "T_Profesores_Secundaria" p
    INNER JOIN "T_Aulas" a ON p."Id_Profesor_Secundaria" = a."Id_Profesor_Secundaria"
    WHERE p."Id_Profesor_Secundaria" = $1 AND p."Estado" = true
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as TutorGenerico;
}

/**
 * Busca personal administrativo por ID para datos genéricos - ACTUALIZADA
 */
export async function buscarPersonalAdministrativoPorIdGenerico(
  id: string,
  instanciaEnUso?: RDP02
): Promise<PersonalAdministrativoGenerico | null> {
  const sql = `
    SELECT 
      "Id_Personal_Administrativo",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Personal_Administrativo"
    WHERE "Id_Personal_Administrativo" = $1 AND "Estado" = true
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as PersonalAdministrativoGenerico;
}

/**
 * Busca personal genérico por rol y Id, devolviendo información básica - ACTUALIZADA
 * @param rol Rol del usuario a buscar
 * @param id Id del usuario a buscar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Información básica del usuario o null si no existe
 */
export async function buscarUsuarioGenericoPorRolyId(
  rol: RolesSistema,
  id: string | number,
  instanciaEnUso?: RDP02
): Promise<GenericUser | null> {
  let userData: any = null;
  let idField: string = "";

  // Buscar según el rol específico
  switch (rol) {
    case RolesSistema.Directivo:
      userData = await buscarDirectivoPorIDGenerico(
        id as number,
        instanciaEnUso
      );
      idField = userData?.Id_Directivo?.toString() || ""; // Usar Id_Directivo como identificador
      break;

    case RolesSistema.Auxiliar:
      userData = await buscarAuxiliarPorIdGenerico(
        id as string,
        instanciaEnUso
      );
      idField = userData?.Id_Auxiliar || "";
      break;

    case RolesSistema.ProfesorPrimaria:
      userData = await buscarProfesorPrimariaPorIdGenerico(
        id as string,
        instanciaEnUso
      );
      idField = userData?.Id_Profesor_Primaria || "";
      break;

    case RolesSistema.ProfesorSecundaria:
      userData = await buscarProfesorSecundariaPorIdGenerico(
        id as string,
        instanciaEnUso
      );
      idField = userData?.Id_Profesor_Secundaria || "";
      break;

    case RolesSistema.Tutor:
      userData = await buscarTutorPorIdGenerico(
        id as string,
        instanciaEnUso
      );
      idField = userData?.Id_Profesor_Secundaria || "";
      break;

    case RolesSistema.PersonalAdministrativo:
      userData = await buscarPersonalAdministrativoPorIdGenerico(
        id as string,
        instanciaEnUso
      );
      idField = userData?.Id_Personal_Administrativo || "";
      break;

    default:
      throw new Error(`Rol no soportado: ${rol}`);
  }

  // Si no se encontró el usuario
  if (!userData) {
    return null;
  }

  // Estructurar los datos según la interfaz GenericUser - ACTUALIZADA
  const genericUser: GenericUser = {
    ID_Usuario: idField,
    Rol: rol,
    Nombres: userData.Nombres,
    Apellidos: userData.Apellidos,
    Genero: userData.Genero as Genero,
    Google_Drive_Foto_ID: userData.Google_Drive_Foto_ID || null, // CAMPO AGREGADO
  };

  // Solo para directivos: agregar el identificador nacional
  if (rol === RolesSistema.Directivo) {
    genericUser.Identificador_Nacional_Directivo = userData.Identificador_Nacional;
  }

  return genericUser;
}