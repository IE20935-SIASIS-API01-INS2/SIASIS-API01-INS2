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
 * Determina si un criterio de búsqueda es numérico (DNI) o texto (nombres/apellidos)
 */
function analizarCriterioBusqueda(criterio: string): {
  esDNI: boolean;
  palabrasBusqueda: string[];
} {
  const criterioLimpio = criterio.trim();

  // Si es solo números, es búsqueda por DNI
  if (/^\d+$/.test(criterioLimpio)) {
    return {
      esDNI: true,
      palabrasBusqueda: [criterioLimpio],
    };
  }

  // Si contiene letras, es búsqueda por nombres/apellidos
  const palabras = criterioLimpio
    .split(/\s+/)
    .filter((palabra) => palabra.length > 0)
    .map((palabra) => palabra.toLowerCase());

  return {
    esDNI: false,
    palabrasBusqueda: palabras,
  };
}

/**
 * Construye la cláusula WHERE para búsqueda por nombres/apellidos
 */
function construirClausulaWherePorNombres(
  palabras: string[],
  campoNombres: string,
  campoApellidos: string,
  parametroInicial: number = 1
): { clausula: string; parametros: string[] } {
  if (palabras.length === 0) {
    return { clausula: "", parametros: [] };
  }

  const condiciones: string[] = [];
  const parametros: string[] = [];
  let indiceParam = parametroInicial;

  palabras.forEach((palabra) => {
    const palabraConComodines = `%${palabra}%`;
    condiciones.push(
      `(LOWER(${campoNombres}) LIKE $${indiceParam} OR LOWER(${campoApellidos}) LIKE $${
        indiceParam + 1
      })`
    );
    parametros.push(palabraConComodines, palabraConComodines);
    indiceParam += 2;
  });

  return {
    clausula: condiciones.join(" AND "),
    parametros,
  };
}

/**
 * Busca directivos por criterio flexible - ACTUALIZADA
 */
export async function buscarDirectivosPorCriterio(
  criterio?: string,
  limite: number = 10,
  instanciaEnUso?: RDP02
): Promise<DirectivoGenerico[]> {
  let sql = `
    SELECT
      "Id_Directivo",
      "DNI",
      "Nombres",
      "Apellidos", 
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Directivos"
  `;

  let parametros: any[] = [];
  let condicionesWhere: string[] = [];

  if (criterio && criterio.trim()) {
    const { esDNI, palabrasBusqueda } = analizarCriterioBusqueda(criterio);

    if (esDNI) {
      condicionesWhere.push(`"DNI" LIKE $1`);
      parametros.push(`%${palabrasBusqueda[0]}%`);
    } else {
      const { clausula, parametros: paramNombres } =
        construirClausulaWherePorNombres(
          palabrasBusqueda,
          '"Nombres"',
          '"Apellidos"'
        );
      if (clausula) {
        condicionesWhere.push(`(${clausula})`);
        parametros.push(...paramNombres);
      }
    }
  }

  if (condicionesWhere.length > 0) {
    sql += ` WHERE ${condicionesWhere.join(" AND ")}`;
  }

  sql += ` ORDER BY "Nombres", "Apellidos" LIMIT $${parametros.length + 1}`;
  parametros.push(limite);

  const result = await query(instanciaEnUso, sql, parametros);
  return result.rows as DirectivoGenerico[];
}

/**
 * Busca auxiliares por criterio flexible - ACTUALIZADA
 */
export async function buscarAuxiliaresPorCriterio(
  criterio?: string,
  limite: number = 10,
  instanciaEnUso?: RDP02
): Promise<AuxiliarGenerico[]> {
  let sql = `
    SELECT 
      "DNI_Auxiliar",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Auxiliares"
    WHERE "Estado" = true
  `;

  let parametros: any[] = [];
  let condicionesAdicionales: string[] = [];

  if (criterio && criterio.trim()) {
    const { esDNI, palabrasBusqueda } = analizarCriterioBusqueda(criterio);

    if (esDNI) {
      condicionesAdicionales.push(`"DNI_Auxiliar" LIKE $1`);
      parametros.push(`%${palabrasBusqueda[0]}%`);
    } else {
      const { clausula, parametros: paramNombres } =
        construirClausulaWherePorNombres(
          palabrasBusqueda,
          '"Nombres"',
          '"Apellidos"'
        );
      if (clausula) {
        condicionesAdicionales.push(`(${clausula})`);
        parametros.push(...paramNombres);
      }
    }
  }

  if (condicionesAdicionales.length > 0) {
    sql += ` AND ${condicionesAdicionales.join(" AND ")}`;
  }

  sql += ` ORDER BY "Nombres", "Apellidos" LIMIT $${parametros.length + 1}`;
  parametros.push(limite);

  const result = await query(instanciaEnUso, sql, parametros);
  return result.rows as AuxiliarGenerico[];
}

/**
 * Busca profesores de primaria por criterio flexible - ACTUALIZADA
 */
export async function buscarProfesoresPrimariaPorCriterio(
  criterio?: string,
  limite: number = 10,
  instanciaEnUso?: RDP02
): Promise<ProfesorPrimariaGenerico[]> {
  let sql = `
    SELECT 
      "DNI_Profesor_Primaria",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Profesores_Primaria"
    WHERE "Estado" = true
  `;

  let parametros: any[] = [];
  let condicionesAdicionales: string[] = [];

  if (criterio && criterio.trim()) {
    const { esDNI, palabrasBusqueda } = analizarCriterioBusqueda(criterio);

    if (esDNI) {
      condicionesAdicionales.push(`"DNI_Profesor_Primaria" LIKE $1`);
      parametros.push(`%${palabrasBusqueda[0]}%`);
    } else {
      const { clausula, parametros: paramNombres } =
        construirClausulaWherePorNombres(
          palabrasBusqueda,
          '"Nombres"',
          '"Apellidos"'
        );
      if (clausula) {
        condicionesAdicionales.push(`(${clausula})`);
        parametros.push(...paramNombres);
      }
    }
  }

  if (condicionesAdicionales.length > 0) {
    sql += ` AND ${condicionesAdicionales.join(" AND ")}`;
  }

  sql += ` ORDER BY "Nombres", "Apellidos" LIMIT $${parametros.length + 1}`;
  parametros.push(limite);

  const result = await query(instanciaEnUso, sql, parametros);
  return result.rows as ProfesorPrimariaGenerico[];
}

/**
 * Busca profesores de secundaria por criterio flexible - ACTUALIZADA
 */
export async function buscarProfesoresSecundariaPorCriterio(
  criterio?: string,
  limite: number = 10,
  instanciaEnUso?: RDP02
): Promise<ProfesorSecundariaGenerico[]> {
  let sql = `
    SELECT 
      "DNI_Profesor_Secundaria",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Profesores_Secundaria"
    WHERE "Estado" = true
  `;

  let parametros: any[] = [];
  let condicionesAdicionales: string[] = [];

  if (criterio && criterio.trim()) {
    const { esDNI, palabrasBusqueda } = analizarCriterioBusqueda(criterio);

    if (esDNI) {
      condicionesAdicionales.push(`"DNI_Profesor_Secundaria" LIKE $1`);
      parametros.push(`%${palabrasBusqueda[0]}%`);
    } else {
      const { clausula, parametros: paramNombres } =
        construirClausulaWherePorNombres(
          palabrasBusqueda,
          '"Nombres"',
          '"Apellidos"'
        );
      if (clausula) {
        condicionesAdicionales.push(`(${clausula})`);
        parametros.push(...paramNombres);
      }
    }
  }

  if (condicionesAdicionales.length > 0) {
    sql += ` AND ${condicionesAdicionales.join(" AND ")}`;
  }

  sql += ` ORDER BY "Nombres", "Apellidos" LIMIT $${parametros.length + 1}`;
  parametros.push(limite);

  const result = await query(instanciaEnUso, sql, parametros);
  return result.rows as ProfesorSecundariaGenerico[];
}

/**
 * Busca tutores (profesores secundaria con aula) por criterio flexible - ACTUALIZADA
 */
export async function buscarTutoresPorCriterio(
  criterio?: string,
  limite: number = 10,
  instanciaEnUso?: RDP02
): Promise<TutorGenerico[]> {
  let sql = `
    SELECT 
      p."DNI_Profesor_Secundaria",
      p."Nombres",
      p."Apellidos",
      p."Genero",
      p."Google_Drive_Foto_ID"
    FROM "T_Profesores_Secundaria" p
    INNER JOIN "T_Aulas" a ON p."DNI_Profesor_Secundaria" = a."DNI_Profesor_Secundaria"
    WHERE p."Estado" = true
  `;

  let parametros: any[] = [];
  let condicionesAdicionales: string[] = [];

  if (criterio && criterio.trim()) {
    const { esDNI, palabrasBusqueda } = analizarCriterioBusqueda(criterio);

    if (esDNI) {
      condicionesAdicionales.push(`p."DNI_Profesor_Secundaria" LIKE $1`);
      parametros.push(`%${palabrasBusqueda[0]}%`);
    } else {
      const { clausula, parametros: paramNombres } =
        construirClausulaWherePorNombres(
          palabrasBusqueda,
          'p."Nombres"',
          'p."Apellidos"'
        );
      if (clausula) {
        condicionesAdicionales.push(`(${clausula})`);
        parametros.push(...paramNombres);
      }
    }
  }

  if (condicionesAdicionales.length > 0) {
    sql += ` AND ${condicionesAdicionales.join(" AND ")}`;
  }

  sql += ` ORDER BY p."Nombres", p."Apellidos" LIMIT $${parametros.length + 1}`;
  parametros.push(limite);

  const result = await query(instanciaEnUso, sql, parametros);
  return result.rows as TutorGenerico[];
}

/**
 * Busca personal administrativo por criterio flexible - ACTUALIZADA
 */
export async function buscarPersonalAdministrativoPorCriterio(
  criterio?: string,
  limite: number = 10,
  instanciaEnUso?: RDP02
): Promise<PersonalAdministrativoGenerico[]> {
  let sql = `
    SELECT 
      "DNI_Personal_Administrativo",
      "Nombres",
      "Apellidos",
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Personal_Administrativo"
    WHERE "Estado" = true
  `;

  let parametros: any[] = [];
  let condicionesAdicionales: string[] = [];

  if (criterio && criterio.trim()) {
    const { esDNI, palabrasBusqueda } = analizarCriterioBusqueda(criterio);

    if (esDNI) {
      condicionesAdicionales.push(`"DNI_Personal_Administrativo" LIKE $1`);
      parametros.push(`%${palabrasBusqueda[0]}%`);
    } else {
      const { clausula, parametros: paramNombres } =
        construirClausulaWherePorNombres(
          palabrasBusqueda,
          '"Nombres"',
          '"Apellidos"'
        );
      if (clausula) {
        condicionesAdicionales.push(`(${clausula})`);
        parametros.push(...paramNombres);
      }
    }
  }

  if (condicionesAdicionales.length > 0) {
    sql += ` AND ${condicionesAdicionales.join(" AND ")}`;
  }

  sql += ` ORDER BY "Nombres", "Apellidos" LIMIT $${parametros.length + 1}`;
  parametros.push(limite);

  const result = await query(instanciaEnUso, sql, parametros);
  return result.rows as PersonalAdministrativoGenerico[];
}

/**
 * Función principal para buscar usuarios genéricos por rol y criterio flexible - ACTUALIZADA
 * @param rol Rol del usuario a buscar
 * @param criterio Criterio de búsqueda (DNI, nombres, apellidos o combinación)
 * @param limite Máximo número de resultados (máx. 10)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Array de usuarios genéricos que coinciden con el criterio
 */
export async function buscarUsuariosGenericosPorRolYCriterio(
  rol: RolesSistema,
  criterio?: string,
  limite: number = 10,
  instanciaEnUso?: RDP02
): Promise<GenericUser[]> {
  // Validar límite máximo
  const limiteSeguro = Math.min(Math.max(1, limite), 10);

  let rawData: any[] = [];
  let id_o_dniField: string = "";

  // Buscar según el rol específico
  switch (rol) {
    case RolesSistema.Directivo:
      const directivos = await buscarDirectivosPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = directivos;
      id_o_dniField = "Id_Directivo"; // Para directivos usamos el ID como identificador principal
      break;

    case RolesSistema.Auxiliar:
      const auxiliares = await buscarAuxiliaresPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = auxiliares;
      id_o_dniField = "DNI_Auxiliar";
      break;

    case RolesSistema.ProfesorPrimaria:
      const profesoresPrimaria = await buscarProfesoresPrimariaPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = profesoresPrimaria;
      id_o_dniField = "DNI_Profesor_Primaria";
      break;

    case RolesSistema.ProfesorSecundaria:
      const profesoresSecundaria = await buscarProfesoresSecundariaPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = profesoresSecundaria;
      id_o_dniField = "DNI_Profesor_Secundaria";
      break;

    case RolesSistema.Tutor:
      const tutores = await buscarTutoresPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = tutores;
      id_o_dniField = "DNI_Profesor_Secundaria";
      break;

    case RolesSistema.PersonalAdministrativo:
      const personalAdmin = await buscarPersonalAdministrativoPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = personalAdmin;
      id_o_dniField = "DNI_Personal_Administrativo";
      break;

    case RolesSistema.Responsable:
      throw new Error(
        "La búsqueda de responsables no está soportada en este endpoint"
      );

    default:
      throw new Error(`Rol no soportado: ${rol}`);
  }

  // Convertir los datos raw a GenericUser - ACTUALIZADA
  const usuariosGenericos: GenericUser[] = rawData.map((userData) => {
    const baseUser: GenericUser = {
      ID_O_DNI_Usuario: userData[id_o_dniField]?.toString() || "", // Convertir a string por si es número
      Rol: rol,
      Nombres: userData.Nombres,
      Apellidos: userData.Apellidos,
      Genero: userData.Genero as Genero,
      Google_Drive_Foto_ID: userData.Google_Drive_Foto_ID || null, // CAMPO AGREGADO
    };

    // Solo para directivos: agregar el DNI en campo separado
    if (rol === RolesSistema.Directivo) {
      baseUser.DNI_Directivo = userData.DNI;
    }

    return baseUser;
  });

  return usuariosGenericos;
}
