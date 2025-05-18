import { T_Aulas, T_Profesores_Primaria } from "@prisma/client";
import { query } from "../../../connectors/postgres";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";

/**
 * Tipo para representar un profesor de primaria con su aula
 */
export type ProfesorPrimariaConAulas = T_Profesores_Primaria & {
  aulas: T_Aulas[];
};

/**
 * Busca un profesor de primaria por su DNI incluyendo información de su aula
 * @param dniProfesor DNI del profesor de primaria a buscar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del profesor con su aula o null si no existe
 */
export async function buscarProfesorPrimariaPorDNIConAula(
  dniProfesor: string,
  instanciaEnUso?: RDP02
): Promise<ProfesorPrimariaConAulas | null> {
  // Primero obtener los datos básicos del profesor
  const sqlProfesor = `
      SELECT 
        "DNI_Profesor_Primaria",
        "Nombres",
        "Apellidos",
        "Genero",
        "Nombre_Usuario",
        "Estado",
        "Correo_Electronico",
        "Celular",
        "Google_Drive_Foto_ID"
      FROM "T_Profesores_Primaria"
      WHERE "DNI_Profesor_Primaria" = $1
    `;

  const resultProfesor = await query<T_Profesores_Primaria>(
    instanciaEnUso,
    sqlProfesor,
    [dniProfesor]
  );

  if (resultProfesor.rows.length === 0) {
    return null;
  }

  const profesor = resultProfesor.rows[0];

  // Luego obtener el aula asociada (sabemos que solo puede tener una)
  const sqlAula = `
      SELECT 
        "Id_Aula",
        "Nivel",
        "Grado",
        "Seccion",
        "Color"
      FROM "T_Aulas"
      WHERE "DNI_Profesor_Primaria" = $1
      LIMIT 1
    `;

  const resultAula = await query<T_Aulas>(instanciaEnUso, sqlAula, [
    dniProfesor,
  ]);

  // Combinar los resultados (manteniendo el formato con un array para compatibilidad)
  return {
    ...profesor,
    aulas: resultAula.rows,
  };
}