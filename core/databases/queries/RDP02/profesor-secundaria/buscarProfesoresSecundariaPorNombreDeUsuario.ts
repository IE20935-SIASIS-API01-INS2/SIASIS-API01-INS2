// src/core/database/queries/profesores-secundaria/profesorSecundariaQueries.ts
import { T_Profesores_Secundaria, T_Aulas } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

// Interfaz para el resultado de la consulta de profesor con aulas
export interface ProfesorSecundariaConAulas
  extends Omit<T_Profesores_Secundaria, "aulas"> {
  aulas: Pick<T_Aulas, "Id_Aula" | "Nivel" | "Grado" | "Seccion" | "Color">[];
}

/**
 * Busca un profesor de secundaria por su nombre de usuario
 * @param nombreUsuario Nombre de usuario del profesor de secundaria
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del profesor de secundaria o null si no existe
 */
export async function buscarProfesorSecundariaPorNombreUsuario(
  nombreUsuario: string,
  instanciaEnUso?: RDP02
): Promise<T_Profesores_Secundaria | null> {
  const sql = `
    SELECT *
    FROM "T_Profesores_Secundaria"
    WHERE "Nombre_Usuario" = $1
  `;

  // Operación de lectura, sin necesidad de especificar rol
  const result = await query<T_Profesores_Secundaria>(
    instanciaEnUso, // instancia específica o automática si es undefined
    sql,
    [nombreUsuario]
    // No especificamos rol, cualquier instancia puede atender esta consulta
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Busca un profesor de secundaria por su nombre de usuario y obtiene también sus aulas asignadas
 * @param nombreUsuario Nombre de usuario del profesor de secundaria
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del profesor con sus aulas asignadas o null si no existe
 */
export async function buscarProfesorSecundariaConAulasPorNombreDeUsuario(
  nombreUsuario: string,
  instanciaEnUso?: RDP02
): Promise<ProfesorSecundariaConAulas | null> {
  // Primero obtenemos los datos del profesor
  const sqlProfesor = `
    SELECT *
    FROM "T_Profesores_Secundaria"
    WHERE "Nombre_Usuario" = $1
  `;

  const resultProfesor = await query<T_Profesores_Secundaria>(
    instanciaEnUso,
    sqlProfesor,
    [nombreUsuario]
  );

  if (resultProfesor.rows.length === 0) {
    return null;
  }

  const profesor = resultProfesor.rows[0];

  // Ahora obtenemos las aulas asignadas
  const sqlAulas = `
    SELECT "Id_Aula", "Nivel", "Grado", "Seccion", "Color"
    FROM "T_Aulas"
    WHERE "DNI_Profesor_Secundaria" = $1
  `;

  const resultAulas = await query<
    Pick<T_Aulas, "Id_Aula" | "Nivel" | "Grado" | "Seccion" | "Color">
  >(instanciaEnUso, sqlAulas, [profesor.DNI_Profesor_Secundaria]);

  // Combinamos los resultados
  return {
    ...profesor,
    aulas: resultAulas.rows,
  };
}
