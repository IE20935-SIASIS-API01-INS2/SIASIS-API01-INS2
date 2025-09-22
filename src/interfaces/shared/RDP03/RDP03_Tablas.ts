
/**
 * Nombres de todas las tablas en RDP03 (MongoDB)
 */
export type RDP03_Nombres_Tablas =
  | "T_Estudiantes"
  | "T_Responsables"
  | "T_Relaciones_E_R"
  | "T_Profesores_Primaria"
  | "T_Profesores_Secundaria"
  | "T_Aulas"
  | "T_Cursos_Horario"
  | "T_Auxiliares"
  | "T_Bloqueo_Roles"
  | "T_Registro_Fallos_Sistema"
  | "T_A_E_P_1"
  | "T_A_E_P_2"
  | "T_A_E_P_3"
  | "T_A_E_P_4"
  | "T_A_E_P_5"
  | "T_A_E_P_6"
  | "T_A_E_S_1"
  | "T_A_E_S_2"
  | "T_A_E_S_3"
  | "T_A_E_S_4"
  | "T_A_E_S_5"
  | "T_Ultima_Modificacion_Tablas"
  | "T_Eventos"
  | "T_Directivos"
  | "T_Personal_Administrativo"
  | "T_Vacaciones_Interescolares";

/**
 * Nombres de todos los campos ID en el sistema
 */
export type RDP03_Campos_ID =
  | "Id_Estudiante"
  | "Id_Responsable"
  | "Id_Relacion"
  | "Id_Profesor_Primaria"
  | "Id_Profesor_Secundaria"
  | "Id_Aula"
  | "Id_Curso_Horario"
  | "Id_Auxiliar"
  | "Id_Bloqueo_Rol"
  | "Id_Registro_Fallo_Sistema"
  | "Id_Asistencia_Escolar_Mensual"
  | "Nombre_Tabla"
  | "Id_Evento"
  | "Id_Directivo"
  | "Id_Personal_Administrativo" 
  | "Id_Vacacion_Interescolar";

/**
 * Mapeo de tablas a sus campos ID correspondientes
 * MongoDB (_id) -> Campo esperado por la aplicación
 */
export const RDP03_MONGODB_TO_APP_ID_MAPPING: Record<
  RDP03_Nombres_Tablas,
  RDP03_Campos_ID
> = {
  // Entidades principales
  T_Estudiantes: "Id_Estudiante",
  T_Responsables: "Id_Responsable",
  T_Relaciones_E_R: "Id_Relacion",
  T_Profesores_Primaria: "Id_Profesor_Primaria",
  T_Profesores_Secundaria: "Id_Profesor_Secundaria",
  T_Aulas: "Id_Aula",
  T_Cursos_Horario: "Id_Curso_Horario",
  T_Auxiliares: "Id_Auxiliar",
  T_Directivos: "Id_Directivo",
  T_Personal_Administrativo: "Id_Personal_Administrativo",

  // Entidades de control
  T_Bloqueo_Roles: "Id_Bloqueo_Rol",
  T_Registro_Fallos_Sistema: "Id_Registro_Fallo_Sistema",
  T_Eventos: "Id_Evento",
  T_Ultima_Modificacion_Tablas: "Nombre_Tabla",

  // Tablas de asistencia primaria
  T_A_E_P_1: "Id_Asistencia_Escolar_Mensual",
  T_A_E_P_2: "Id_Asistencia_Escolar_Mensual",
  T_A_E_P_3: "Id_Asistencia_Escolar_Mensual",
  T_A_E_P_4: "Id_Asistencia_Escolar_Mensual",
  T_A_E_P_5: "Id_Asistencia_Escolar_Mensual",
  T_A_E_P_6: "Id_Asistencia_Escolar_Mensual",

  // Tablas de asistencia secundaria
  T_A_E_S_1: "Id_Asistencia_Escolar_Mensual",
  T_A_E_S_2: "Id_Asistencia_Escolar_Mensual",
  T_A_E_S_3: "Id_Asistencia_Escolar_Mensual",
  T_A_E_S_4: "Id_Asistencia_Escolar_Mensual",
  T_A_E_S_5: "Id_Asistencia_Escolar_Mensual",

  T_Vacaciones_Interescolares: "Id_Vacacion_Interescolar",
};

/**
 * Mapeo inverso: Campo de la aplicación -> MongoDB (_id)
 * Campo esperado por la aplicación -> MongoDB (_id)
 */
export const RDP03_APP_TO_MONGODB_ID_MAPPING: Record<RDP03_Campos_ID, "_id"> = {
  Id_Estudiante: "_id",
  Id_Responsable: "_id",
  Id_Relacion: "_id",
  Id_Profesor_Primaria: "_id",
  Id_Profesor_Secundaria: "_id",
  Id_Aula: "_id",
  Id_Curso_Horario: "_id",
  Id_Auxiliar: "_id",
  Id_Bloqueo_Rol: "_id",
  Id_Registro_Fallo_Sistema: "_id",
  Id_Asistencia_Escolar_Mensual: "_id",
  Nombre_Tabla: "_id",
  Id_Evento: "_id",
  Id_Directivo: "_id",
  Id_Personal_Administrativo: "_id",
  Id_Vacacion_Interescolar: "_id",
};

/**
 * Obtiene el nombre del campo ID para una tabla específica
 */
export function obtenerCampoIdParaTabla(
  tabla: RDP03_Nombres_Tablas
): RDP03_Campos_ID {
  return RDP03_MONGODB_TO_APP_ID_MAPPING[tabla];
}

/**
 * Verifica si una tabla existe en el mapeo
 */
export function esTablaValida(tabla: string): tabla is RDP03_Nombres_Tablas {
  return tabla in RDP03_MONGODB_TO_APP_ID_MAPPING;
}

/**
 * Verifica si un campo ID es válido
 */
export function esCampoIdValido(campo: string): campo is RDP03_Campos_ID {
  return campo in RDP03_APP_TO_MONGODB_ID_MAPPING;
}

/**
 * Crea una proyección para MongoDB que convierte _id al campo esperado
 */
export function crearProyeccionMongoDB(
  tabla: RDP03_Nombres_Tablas,
  camposAdicionales: string[] = []
): Record<string, number | string> {
  const campoId = obtenerCampoIdParaTabla(tabla);

  const proyeccion: Record<string, number | string> = {
    [campoId]: "$_id",
    _id: 0,
  };

  // Agregar campos adicionales
  camposAdicionales.forEach((campo) => {
    if (campo !== campoId) {
      proyeccion[campo] = 1;
    }
  });

  return proyeccion;
}

/**
 * Convierte un filtro de la aplicación a formato MongoDB
 */
export function convertirFiltroParaMongoDB(
  tabla: RDP03_Nombres_Tablas,
  filtro: Record<string, any>
): Record<string, any> {
  const campoId = obtenerCampoIdParaTabla(tabla);
  const nuevoFiltro = { ...filtro };

  // Si el filtro contiene el campo ID de la aplicación, convertirlo a _id
  if (nuevoFiltro[campoId] !== undefined) {
    nuevoFiltro._id = nuevoFiltro[campoId];
    delete nuevoFiltro[campoId];
  }

  return nuevoFiltro;
}

/**
 * Convierte datos de la aplicación a formato MongoDB (para inserción/actualización)
 */
export function convertirDatosParaMongoDB(
  tabla: RDP03_Nombres_Tablas,
  datos: Record<string, any>
): Record<string, any> {
  const campoId = obtenerCampoIdParaTabla(tabla);
  const nuevosDatos = { ...datos };

  // Si los datos contienen el campo ID de la aplicación, convertirlo a _id
  if (nuevosDatos[campoId] !== undefined) {
    nuevosDatos._id = nuevosDatos[campoId];
    delete nuevosDatos[campoId];
  }

  return nuevosDatos;
}

/**
 * Transforma un resultado de MongoDB al formato esperado por la aplicación
 */
export function transformarResultadoMongoDB<T = any>(
  tabla: RDP03_Nombres_Tablas,
  resultado: any
): T | null {
  if (!resultado) return null;

  const campoId = obtenerCampoIdParaTabla(tabla);

  // Si es un array, transformar cada elemento
  if (Array.isArray(resultado)) {
    return resultado.map((item) => transformarElemento(item, campoId)) as T;
  }

  // Transformar elemento único
  return transformarElemento(resultado, campoId) as T;
}

/**
 * Función auxiliar para transformar un elemento individual
 */
export function transformarElemento(elemento: any, campoId: RDP03_Campos_ID): any {
  if (!elemento || typeof elemento !== "object") return elemento;

  const { _id, ...resto } = elemento;

  return {
    [campoId]: _id,
    ...resto,
  };
}

/**
 * Función auxiliar para transformar un elemento para registrar en RDP03
 * (Operación inversa a transformarElemento)
 */
export function transformarElementoParaRegistrarEnRDP03(elemento: any, campoId: RDP03_Campos_ID): any {
  if (!elemento || typeof elemento !== "object") return elemento;

  // Crear una copia para no mutar el objeto original
  const { [campoId]: valorId, ...resto } = elemento;

  return {
    _id: valorId,
    ...resto,
  };
}


/**
 * Pipeline de agregación estándar para una tabla
 */
export function crearPipelineEstandar(
  tabla: RDP03_Nombres_Tablas,
  filtro: Record<string, any> = {},
  camposAdicionales: string[] = []
): any[] {
  const filtroMongoDB = convertirFiltroParaMongoDB(tabla, filtro);
  const proyeccion = crearProyeccionMongoDB(tabla, camposAdicionales);

  const pipeline: any[] = [];

  // Agregar match si hay filtros
  if (Object.keys(filtroMongoDB).length > 0) {
    pipeline.push({ $match: filtroMongoDB });
  }

  // Agregar proyección
  pipeline.push({ $project: proyeccion });

  return pipeline;
}

/**
 * Tipos para mejor intellisense
 */
export type ProyeccionMongoDB = Record<string, number | string>;
export type FiltroMongoDB = Record<string, any>;
export type DatosMongoDB = Record<string, any>;
