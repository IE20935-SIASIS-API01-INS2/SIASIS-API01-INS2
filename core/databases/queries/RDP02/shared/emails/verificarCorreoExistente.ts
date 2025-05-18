import { RDP02 } from "../../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../../connectors/postgres";

/**
 * Verifica si un correo electrónico ya existe en las tablas relevantes
 * @param correo Correo electrónico a verificar
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns true si el correo ya existe, false si no
 */
export async function verificarCorreoExistente(
  correo: string,
  instanciaEnUso?: RDP02
): Promise<boolean> {
  // Verificamos primero en la tabla de Directivos
  const sqlDirectivos = `
    SELECT 1 FROM "T_Directivos" 
    WHERE "Correo_Electronico" = $1
    LIMIT 1
  `;

  const resultDirectivos = await query(instanciaEnUso, sqlDirectivos, [correo]);

  if (resultDirectivos.rows.length > 0) {
    return true;
  }

  // Si no existe en Directivos, verificamos en Profesores_Secundaria
  const sqlProfesoresSecundaria = `
    SELECT 1 FROM "T_Profesores_Secundaria" 
    WHERE "Correo_Electronico" = $1
    LIMIT 1
  `;

  const resultProfesoresSecundaria = await query(
    instanciaEnUso,
    sqlProfesoresSecundaria,
    [correo]
  );

  return resultProfesoresSecundaria.rows.length > 0;
}
