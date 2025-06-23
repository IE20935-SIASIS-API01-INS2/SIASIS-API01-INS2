import {
  AuxiliarGenerico,
  DirectivoGenerico,
  GenericUser,
  ProfesorPrimariaGenerico,
  ProfesorSecundariaGenerico,
} from "../../../../../src/interfaces/shared/GenericUser";
import { Genero } from "../../../../../src/interfaces/shared/Genero";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { RolesSistema } from "../../../../../src/interfaces/shared/RolesSistema";
import { query } from "../../../connectors/postgres";

/**
 * Busca directivo por DNI para datos genéricos - ACTUALIZADA
 */
export async function buscarDirectivoPorDNIGenerico(
  dni: string,
  instanciaEnUso?: RDP02
): Promise<DirectivoGenerico | null> {
  const sql = `
    SELECT
      "Id_Directivo",
      "DNI",
      "Nombres",
      "Apellidos", 
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Directivos"
    WHERE "DNI" = $1
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [dni]);

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
      "DNI",
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
 * Busca auxiliar por DNI para datos genéricos - ACTUALIZADA
 */
export async function buscarAuxiliarPorDNIGenerico(
  dni: string,
  instanciaEnUso?: RDP02
): Promise<AuxiliarGenerico | null> {
  const sql = `
    SELECT 
      "DNI_Auxiliar",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Auxiliares"
    WHERE "DNI_Auxiliar" = $1 AND "Estado" = true
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [dni]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as AuxiliarGenerico;
}

/**
 * Busca profesor de primaria por DNI para datos genéricos - ACTUALIZADA
 */
export async function buscarProfesorPrimariaPorDNIGenerico(
  dni: string,
  instanciaEnUso?: RDP02
): Promise<ProfesorPrimariaGenerico | null> {
  const sql = `
    SELECT 
      "DNI_Profesor_Primaria",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Profesores_Primaria"
    WHERE "DNI_Profesor_Primaria" = $1 AND "Estado" = true
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [dni]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as ProfesorPrimariaGenerico;
}

/**
 * Busca profesor de secundaria por DNI para datos genéricos - ACTUALIZADA
 */
export async function buscarProfesorSecundariaPorDNIGenerico(
  dni: string,
  instanciaEnUso?: RDP02
): Promise<ProfesorSecundariaGenerico | null> {
  const sql = `
    SELECT 
      "DNI_Profesor_Secundaria",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Profesores_Secundaria"
    WHERE "DNI_Profesor_Secundaria" = $1 AND "Estado" = true
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [dni]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as ProfesorSecundariaGenerico;
}

// Interfaz local actualizada para incluir Google_Drive_Foto_ID
export interface TutorGenerico {
  DNI_Profesor_Secundaria: string;
  Nombres: string;
  Apellidos: string;
  Genero: string;
  Google_Drive_Foto_ID: string | null;
}

/**
 * Busca tutor (profesor secundaria con aula) por DNI para datos genéricos - ACTUALIZADA
 */
export async function buscarTutorPorDNIGenerico(
  dni: string,
  instanciaEnUso?: RDP02
): Promise<TutorGenerico | null> {
  const sql = `
    SELECT 
      p."DNI_Profesor_Secundaria",
      p."Nombres",
      p."Apellidos",
      p."Genero",
      p."Google_Drive_Foto_ID"
    FROM "T_Profesores_Secundaria" p
    INNER JOIN "T_Aulas" a ON p."DNI_Profesor_Secundaria" = a."DNI_Profesor_Secundaria"
    WHERE p."DNI_Profesor_Secundaria" = $1 AND p."Estado" = true
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [dni]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as TutorGenerico;
}

// Interfaz local actualizada para incluir Google_Drive_Foto_ID
export interface PersonalAdministrativoGenerico {
  DNI_Personal_Administrativo: string;
  Nombres: string;
  Apellidos: string;
  Genero: string;
  Google_Drive_Foto_ID: string | null;
}

/**
 * Busca personal administrativo por DNI para datos genéricos - ACTUALIZADA
 */
export async function buscarPersonalAdministrativoPorDNIGenerico(
  dni: string,
  instanciaEnUso?: RDP02
): Promise<PersonalAdministrativoGenerico | null> {
  const sql = `
    SELECT 
      "DNI_Personal_Administrativo",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Personal_Administrativo"
    WHERE "DNI_Personal_Administrativo" = $1 AND "Estado" = true
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [dni]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as PersonalAdministrativoGenerico;
}

/**
 * Busca personal genérico por rol y DNI, devolviendo información básica - ACTUALIZADA
 * @param rol Rol del usuario a buscar
 * @param idOdni ID o DNI del usuario a buscar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Información básica del usuario o null si no existe
 */
export async function buscarUsuarioGenericoPorRolyIDoDNI(
  rol: RolesSistema,
  idOdni: string | number,
  instanciaEnUso?: RDP02
): Promise<GenericUser | null> {
  let userData: any = null;
  let dniField: string = "";

  // Buscar según el rol específico
  switch (rol) {
    case RolesSistema.Directivo:
      userData = await buscarDirectivoPorIDGenerico(
        idOdni as number,
        instanciaEnUso
      );
      dniField = userData?.Id_Directivo?.toString() || ""; // Usar Id_Directivo como identificador
      break;

    case RolesSistema.Auxiliar:
      userData = await buscarAuxiliarPorDNIGenerico(
        idOdni as string,
        instanciaEnUso
      );
      dniField = userData?.DNI_Auxiliar || "";
      break;

    case RolesSistema.ProfesorPrimaria:
      userData = await buscarProfesorPrimariaPorDNIGenerico(
        idOdni as string,
        instanciaEnUso
      );
      dniField = userData?.DNI_Profesor_Primaria || "";
      break;

    case RolesSistema.ProfesorSecundaria:
      userData = await buscarProfesorSecundariaPorDNIGenerico(
        idOdni as string,
        instanciaEnUso
      );
      dniField = userData?.DNI_Profesor_Secundaria || "";
      break;

    case RolesSistema.Tutor:
      userData = await buscarTutorPorDNIGenerico(
        idOdni as string,
        instanciaEnUso
      );
      dniField = userData?.DNI_Profesor_Secundaria || "";
      break;

    case RolesSistema.PersonalAdministrativo:
      userData = await buscarPersonalAdministrativoPorDNIGenerico(
        idOdni as string,
        instanciaEnUso
      );
      dniField = userData?.DNI_Personal_Administrativo || "";
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
    ID_O_DNI_Usuario: dniField,
    Rol: rol,
    Nombres: userData.Nombres,
    Apellidos: userData.Apellidos,
    Genero: userData.Genero as Genero,
    Google_Drive_Foto_ID: userData.Google_Drive_Foto_ID || null, // CAMPO AGREGADO
  };

  // Solo para directivos: agregar el DNI en campo separado
  if (rol === RolesSistema.Directivo) {
    genericUser.DNI_Directivo = userData.DNI;
  }

  return genericUser;
}
