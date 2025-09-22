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
 * Analiza un criterio de búsqueda y separa números de texto
 * @param criterio Criterio de búsqueda del usuario
 * @returns Objeto con partes numéricas y textuales separadas
 */
function analizarCriterioBusqueda(criterio: string): {
  partesNumericas: string[];
  partesTextuales: string[];
} {
  const criterioLimpio = criterio.trim();
  const palabras = criterioLimpio.split(/\s+/).filter(palabra => palabra.length > 0);
  
  const partesNumericas: string[] = [];
  const partesTextuales: string[] = [];
  
  palabras.forEach(palabra => {
    // Si es solo números (puede incluir guión para el formato identificador-tipo)
    if (/^\d+(-\d+)?$/.test(palabra)) {
      partesNumericas.push(palabra);
    } else {
      // Si contiene letras, es texto para nombres/apellidos
      partesTextuales.push(palabra.toLowerCase());
    }
  });

  return {
    partesNumericas,
    partesTextuales,
  };
}

/**
 * Construye la cláusula WHERE para búsqueda por identificadores
 * @param partesNumericas Array de partes numéricas del criterio
 * @param campoIdentificador Nombre del campo identificador en la BD
 * @param parametroInicial Índice inicial para los parámetros
 * @returns Objeto con la cláusula WHERE y los parámetros
 */
function construirClausulaWherePorIdentificador(
  partesNumericas: string[],
  campoIdentificador: string,
  parametroInicial: number = 1
): { clausula: string; parametros: string[] } {
  if (partesNumericas.length === 0) {
    return { clausula: "", parametros: [] };
  }

  const condiciones: string[] = [];
  const parametros: string[] = [];
  let indiceParam = parametroInicial;

  partesNumericas.forEach(parte => {
    // Si es un número de 8 dígitos sin guión, buscar como DNI por defecto
    if (/^\d{8}$/.test(parte)) {
      // Para directivos, buscar en Identificador_Nacional
      if (campoIdentificador === '"Identificador_Nacional"') {
        condiciones.push(`(${campoIdentificador} LIKE $${indiceParam} OR ${campoIdentificador} LIKE $${indiceParam + 1})`);
        parametros.push(`%${parte}%`, `%${parte}-1%`); // Buscar también como DNI (tipo 1)
        indiceParam += 2;
      } else {
        // Para otros roles, buscar directamente en el campo Id_*
        condiciones.push(`${campoIdentificador} LIKE $${indiceParam}`);
        parametros.push(`%${parte}%`);
        indiceParam += 1;
      }
    } else {
      // Para cualquier otro formato numérico, buscar como está
      condiciones.push(`${campoIdentificador} LIKE $${indiceParam}`);
      parametros.push(`%${parte}%`);
      indiceParam += 1;
    }
  });

  return {
    clausula: condiciones.join(" OR "),
    parametros,
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
      "Identificador_Nacional",
      "Nombres",
      "Apellidos", 
      "Genero",
      "Google_Drive_Foto_ID"
    FROM "T_Directivos"
  `;

  let parametros: any[] = [];
  let condicionesWhere: string[] = [];

  if (criterio && criterio.trim()) {
    const { partesNumericas, partesTextuales } = analizarCriterioBusqueda(criterio);

    // Buscar por identificador si hay partes numéricas
    if (partesNumericas.length > 0) {
      const { clausula, parametros: paramId } = construirClausulaWherePorIdentificador(
        partesNumericas,
        '"Identificador_Nacional"',
        parametros.length + 1
      );
      if (clausula) {
        condicionesWhere.push(`(${clausula})`);
        parametros.push(...paramId);
      }
    }

    // Buscar por nombres si hay partes textuales
    if (partesTextuales.length > 0) {
      const { clausula, parametros: paramNombres } = construirClausulaWherePorNombres(
        partesTextuales,
        '"Nombres"',
        '"Apellidos"',
        parametros.length + 1
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
      "Id_Auxiliar",
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
    const { partesNumericas, partesTextuales } = analizarCriterioBusqueda(criterio);

    // Buscar por identificador si hay partes numéricas
    if (partesNumericas.length > 0) {
      const { clausula, parametros: paramId } = construirClausulaWherePorIdentificador(
        partesNumericas,
        '"Id_Auxiliar"',
        parametros.length + 1
      );
      if (clausula) {
        condicionesAdicionales.push(`(${clausula})`);
        parametros.push(...paramId);
      }
    }

    // Buscar por nombres si hay partes textuales
    if (partesTextuales.length > 0) {
      const { clausula, parametros: paramNombres } = construirClausulaWherePorNombres(
        partesTextuales,
        '"Nombres"',
        '"Apellidos"',
        parametros.length + 1
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
      "Id_Profesor_Primaria",
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
    const { partesNumericas, partesTextuales } = analizarCriterioBusqueda(criterio);

    // Buscar por identificador si hay partes numéricas
    if (partesNumericas.length > 0) {
      const { clausula, parametros: paramId } = construirClausulaWherePorIdentificador(
        partesNumericas,
        '"Id_Profesor_Primaria"',
        parametros.length + 1
      );
      if (clausula) {
        condicionesAdicionales.push(`(${clausula})`);
        parametros.push(...paramId);
      }
    }

    // Buscar por nombres si hay partes textuales
    if (partesTextuales.length > 0) {
      const { clausula, parametros: paramNombres } = construirClausulaWherePorNombres(
        partesTextuales,
        '"Nombres"',
        '"Apellidos"',
        parametros.length + 1
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
      "Id_Profesor_Secundaria",
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
    const { partesNumericas, partesTextuales } = analizarCriterioBusqueda(criterio);

    // Buscar por identificador si hay partes numéricas
    if (partesNumericas.length > 0) {
      const { clausula, parametros: paramId } = construirClausulaWherePorIdentificador(
        partesNumericas,
        '"Id_Profesor_Secundaria"',
        parametros.length + 1
      );
      if (clausula) {
        condicionesAdicionales.push(`(${clausula})`);
        parametros.push(...paramId);
      }
    }

    // Buscar por nombres si hay partes textuales
    if (partesTextuales.length > 0) {
      const { clausula, parametros: paramNombres } = construirClausulaWherePorNombres(
        partesTextuales,
        '"Nombres"',
        '"Apellidos"',
        parametros.length + 1
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
      p."Id_Profesor_Secundaria",
      p."Nombres",
      p."Apellidos",
      p."Genero",
      p."Google_Drive_Foto_ID"
    FROM "T_Profesores_Secundaria" p
    INNER JOIN "T_Aulas" a ON p."Id_Profesor_Secundaria" = a."Id_Profesor_Secundaria"
    WHERE p."Estado" = true
  `;

  let parametros: any[] = [];
  let condicionesAdicionales: string[] = [];

  if (criterio && criterio.trim()) {
    const { partesNumericas, partesTextuales } = analizarCriterioBusqueda(criterio);

    // Buscar por identificador si hay partes numéricas
    if (partesNumericas.length > 0) {
      const { clausula, parametros: paramId } = construirClausulaWherePorIdentificador(
        partesNumericas,
        'p."Id_Profesor_Secundaria"',
        parametros.length + 1
      );
      if (clausula) {
        condicionesAdicionales.push(`(${clausula})`);
        parametros.push(...paramId);
      }
    }

    // Buscar por nombres si hay partes textuales
    if (partesTextuales.length > 0) {
      const { clausula, parametros: paramNombres } = construirClausulaWherePorNombres(
        partesTextuales,
        'p."Nombres"',
        'p."Apellidos"',
        parametros.length + 1
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
      "Id_Personal_Administrativo",
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
    const { partesNumericas, partesTextuales } = analizarCriterioBusqueda(criterio);

    // Buscar por identificador si hay partes numéricas
    if (partesNumericas.length > 0) {
      const { clausula, parametros: paramId } = construirClausulaWherePorIdentificador(
        partesNumericas,
        '"Id_Personal_Administrativo"',
        parametros.length + 1
      );
      if (clausula) {
        condicionesAdicionales.push(`(${clausula})`);
        parametros.push(...paramId);
      }
    }

    // Buscar por nombres si hay partes textuales
    if (partesTextuales.length > 0) {
      const { clausula, parametros: paramNombres } = construirClausulaWherePorNombres(
        partesTextuales,
        '"Nombres"',
        '"Apellidos"',
        parametros.length + 1
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
 * @param criterio Criterio de búsqueda (Id, nombres, apellidos o combinación)
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
  let idField: string = "";

  // Buscar según el rol específico
  switch (rol) {
    case RolesSistema.Directivo:
      const directivos = await buscarDirectivosPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = directivos;
      idField = "Id_Directivo"; // Para directivos usamos el ID como identificador principal
      break;

    case RolesSistema.Auxiliar:
      const auxiliares = await buscarAuxiliaresPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = auxiliares;
      idField = "Id_Auxiliar";
      break;

    case RolesSistema.ProfesorPrimaria:
      const profesoresPrimaria = await buscarProfesoresPrimariaPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = profesoresPrimaria;
      idField = "Id_Profesor_Primaria";
      break;

    case RolesSistema.ProfesorSecundaria:
      const profesoresSecundaria = await buscarProfesoresSecundariaPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = profesoresSecundaria;
      idField = "Id_Profesor_Secundaria";
      break;

    case RolesSistema.Tutor:
      const tutores = await buscarTutoresPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = tutores;
      idField = "Id_Profesor_Secundaria";
      break;

    case RolesSistema.PersonalAdministrativo:
      const personalAdmin = await buscarPersonalAdministrativoPorCriterio(
        criterio,
        limiteSeguro,
        instanciaEnUso
      );
      rawData = personalAdmin;
      idField = "Id_Personal_Administrativo";
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
      ID_Usuario: userData[idField]?.toString() || "", // Convertir a string por si es número
      Rol: rol,
      Nombres: userData.Nombres,
      Apellidos: userData.Apellidos,
      Genero: userData.Genero as Genero,
      Google_Drive_Foto_ID: userData.Google_Drive_Foto_ID || null, // CAMPO AGREGADO
    };

    // Solo para directivos: agregar el Identificador Nacional en campo separado
    if (rol === RolesSistema.Directivo) {
      baseUser.Identificador_Nacional_Directivo = userData.Identificador_Nacional;
    }

    return baseUser;
  });

  return usuariosGenericos;
}