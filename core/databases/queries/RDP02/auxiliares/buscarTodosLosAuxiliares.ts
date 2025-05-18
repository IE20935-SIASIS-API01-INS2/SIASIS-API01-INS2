// core/databases/queries/RDP02/auxiliares/buscarTodosAuxiliares.ts
import { T_Auxiliares } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Busca todos los auxiliares ordenados por apellido
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Lista de auxiliares con campos seleccionados
 */
export async function buscarTodosLosAuxiliares(
  instanciaEnUso?: RDP02
): Promise<
  Pick<
    T_Auxiliares,
    | "DNI_Auxiliar"
    | "Nombres"
    | "Apellidos"
    | "Genero"
    | "Nombre_Usuario"
    | "Estado"
    | "Correo_Electronico"
    | "Celular"
    | "Google_Drive_Foto_ID"
  >[]
> {
  const sql = `
    SELECT 
      "DNI_Auxiliar", 
      "Nombres", 
      "Apellidos", 
      "Genero", 
      "Nombre_Usuario", 
      "Estado", 
      "Correo_Electronico", 
      "Celular", 
      "Google_Drive_Foto_ID"
    FROM "T_Auxiliares"
    ORDER BY "Apellidos" ASC
  `;

  const result = await query<
    Pick<
      T_Auxiliares,
      | "DNI_Auxiliar"
      | "Nombres"
      | "Apellidos"
      | "Genero"
      | "Nombre_Usuario"
      | "Estado"
      | "Correo_Electronico"
      | "Celular"
      | "Google_Drive_Foto_ID"
    >
  >(instanciaEnUso, sql, []);

  return result.rows;
}
