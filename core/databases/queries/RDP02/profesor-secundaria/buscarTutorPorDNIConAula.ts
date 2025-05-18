import { T_Aulas, T_Profesores_Secundaria } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Tipo para representar un tutor con su aula
 */
export type ProfesorSecundariaConAula = T_Profesores_Secundaria & {
  aula: T_Aulas | null;
};

/**
 * Busca un tutor (profesor de secundaria con aula asignada) por su DNI incluyendo información de su aula
 * Incluye todos los campos, incluyendo la contraseña
 * @param dniProfesor DNI del tutor a buscar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del tutor con su aula o null si no existe
 */
export async function buscarTutorPorDNIConAula(
  dniProfesor: string,
  instanciaEnUso?: RDP02
): Promise<ProfesorSecundariaConAula | null> {
  // Consulta única que obtiene el profesor y su aula asociada mediante JOIN
  const sql = `
    SELECT 
      p."DNI_Profesor_Secundaria",
      p."Nombres",
      p."Apellidos",
      p."Genero",
      p."Nombre_Usuario",
      p."Estado",
      p."Correo_Electronico",
      p."Celular",
      p."Google_Drive_Foto_ID",
      p."Contraseña",
      a."Id_Aula",
      a."Nivel",
      a."Grado",
      a."Seccion",
      a."Color"
    FROM "T_Profesores_Secundaria" p
    LEFT JOIN "T_Aulas" a ON p."DNI_Profesor_Secundaria" = a."DNI_Profesor_Secundaria"
    WHERE p."DNI_Profesor_Secundaria" = $1
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [dniProfesor]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  // Verificar si tiene aula asignada
  const tieneAula = row.Id_Aula !== null;

  // Si no tiene aula asignada, no es un tutor
  if (!tieneAula) {
    return null;
  }

  // Estructurar los datos como ProfesorSecundariaConAula
  const profesor: ProfesorSecundariaConAula = {
    DNI_Profesor_Secundaria: row.DNI_Profesor_Secundaria,
    Nombres: row.Nombres,
    Apellidos: row.Apellidos,
    Genero: row.Genero,
    Nombre_Usuario: row.Nombre_Usuario,
    Estado: row.Estado,
    Correo_Electronico: row.Correo_Electronico,
    Celular: row.Celular,
    Google_Drive_Foto_ID: row.Google_Drive_Foto_ID,
    Contraseña: row.Contraseña,
    aula: {
      Id_Aula: row.Id_Aula,
      Nivel: row.Nivel,
      Grado: row.Grado,
      Seccion: row.Seccion,
      Color: row.Color,
      DNI_Profesor_Primaria: null, // Campos que no están en el SELECT pero son parte del tipo T_Aulas
      DNI_Profesor_Secundaria: row.DNI_Profesor_Secundaria,
    },
  };

  return profesor;
}

/**
 * Busca un tutor (profesor de secundaria con aula asignada) por su DNI seleccionando campos específicos
 * @param dniProfesor DNI del tutor a buscar
 * @param camposProfesor Campos específicos a seleccionar del profesor
 * @param camposAula Campos específicos a seleccionar del aula
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del tutor con su aula o null si no existe
 */
export async function buscarTutorPorDNIConAulaSelect<
  K extends keyof T_Profesores_Secundaria,
  A extends keyof T_Aulas
>(
  dniProfesor: string,
  camposProfesor: K[],
  camposAula: A[],
  instanciaEnUso?: RDP02
): Promise<
  (Pick<T_Profesores_Secundaria, K> & { aula: Pick<T_Aulas, A> | null }) | null
> {
  // Validar que hay al menos un campo seleccionado
  if (camposProfesor.length === 0 || camposAula.length === 0) {
    throw new Error("Debe seleccionar al menos un campo para profesor y aula");
  }

  // Construir la consulta SQL con los campos especificados
  const camposProfStr = camposProfesor
    .map((campo) => `p."${String(campo)}" as "${String(campo)}"`)
    .join(", ");
  const camposAulaStr = camposAula
    .map((campo) => `a."${String(campo)}" as "aula_${String(campo)}"`)
    .join(", ");

  const sql = `
    SELECT 
      ${camposProfStr},
      ${camposAulaStr}
    FROM "T_Profesores_Secundaria" p
    LEFT JOIN "T_Aulas" a ON p."DNI_Profesor_Secundaria" = a."DNI_Profesor_Secundaria"
    WHERE p."DNI_Profesor_Secundaria" = $1
    LIMIT 1
  `;

  const result = await query(instanciaEnUso, sql, [dniProfesor]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  // Verificar si tiene aula asignada comprobando la presencia de algún campo del aula
  const aulaIDField = `aula_${String(camposAula[0])}`;
  const tieneAula = row[aulaIDField] !== null;

  // Si no tiene aula asignada, no es un tutor
  if (!tieneAula) {
    return null;
  }

  // Extraer los campos del profesor
  const profesorData: any = {};
  camposProfesor.forEach((campo) => {
    profesorData[String(campo)] = row[String(campo)];
  });

  // Extraer los campos del aula
  const aulaData: any = {};
  camposAula.forEach((campo) => {
    aulaData[String(campo)] = row[`aula_${String(campo)}`];
  });

  // Estructurar los datos como solicitado
  return {
    ...profesorData,
    aula: aulaData,
  };
}
