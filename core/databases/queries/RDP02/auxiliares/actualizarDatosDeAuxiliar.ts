// core/databases/queries/RDP02/auxiliares/actualizarAuxiliar.ts
import { T_Auxiliares } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Actualiza los datos de un auxiliar
 * @param dniAuxiliar DNI del auxiliar a actualizar
 * @param datos Datos a actualizar (campos parciales)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos actualizados del auxiliar o null si no se encuentra
 */
export async function actualizarDatosDeAuxiliar(
  dniAuxiliar: string,
  datos: {
    Nombres?: string;
    Apellidos?: string;
    Genero?: string;
    Celular?: string;
    Correo_Electronico?: string | null;
  },
  instanciaEnUso?: RDP02
): Promise<Pick<
  T_Auxiliares,
  | "DNI_Auxiliar"
  | "Nombres"
  | "Apellidos"
  | "Genero"
  | "Estado"
  | "Celular"
  | "Correo_Electronico"
> | null> {
  try {
    // Construir la parte SET de la consulta SQL dinámicamente
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    // Añadir cada campo proporcionado a la cláusula SET
    for (const [key, value] of Object.entries(datos)) {
      setClauses.push(`"${key}" = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    // Si no hay campos para actualizar, retornar null
    if (setClauses.length === 0) {
      return null;
    }

    // Añadir el identificador al final de los parámetros
    params.push(dniAuxiliar);

    const sql = `
      UPDATE "T_Auxiliares" 
      SET ${setClauses.join(", ")} 
      WHERE "DNI_Auxiliar" = $${paramIndex}
      RETURNING "DNI_Auxiliar", "Nombres", "Apellidos", "Genero", "Estado", "Celular", "Correo_Electronico"
    `;

    const result = await query<
      Pick<
        T_Auxiliares,
        | "DNI_Auxiliar"
        | "Nombres"
        | "Apellidos"
        | "Genero"
        | "Estado"
        | "Celular"
        | "Correo_Electronico"
      >
    >(instanciaEnUso, sql, params);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    // Capturar y relanzar errores específicos para que sean manejados por el controlador
    throw error;
  }
}
