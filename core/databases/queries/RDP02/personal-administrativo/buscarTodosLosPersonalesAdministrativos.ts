// core/databases/queries/RDP02/personal-administrativo/buscarTodoPersonalAdministrativo.ts
import { T_Personal_Administrativo } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

/**
 * Busca todo el personal administrativo ordenado por apellido
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Lista de personal administrativo con campos seleccionados
 */
export async function buscarTodosLosPersonalesAdministrativo(
  instanciaEnUso?: RDP02
): Promise<
  Pick<
    T_Personal_Administrativo,
    | "DNI_Personal_Administrativo"
    | "Nombres"
    | "Apellidos"
    | "Genero"
    | "Nombre_Usuario"
    | "Estado"
    | "Celular"
    | "Google_Drive_Foto_ID"
    | "Horario_Laboral_Entrada"
    | "Horario_Laboral_Salida"
    | "Cargo"
  >[]
> {
  const sql = `
    SELECT 
      "DNI_Personal_Administrativo", 
      "Nombres", 
      "Apellidos", 
      "Genero", 
      "Nombre_Usuario", 
      "Estado", 
      "Celular", 
      "Google_Drive_Foto_ID", 
      "Horario_Laboral_Entrada", 
      "Horario_Laboral_Salida", 
      "Cargo"
    FROM "T_Personal_Administrativo"
    ORDER BY "Apellidos" ASC
  `;

  const result = await query<
    Pick<
      T_Personal_Administrativo,
      | "DNI_Personal_Administrativo"
      | "Nombres"
      | "Apellidos"
      | "Genero"
      | "Nombre_Usuario"
      | "Estado"
      | "Celular"
      | "Google_Drive_Foto_ID"
      | "Horario_Laboral_Entrada"
      | "Horario_Laboral_Salida"
      | "Cargo"
    >
  >(instanciaEnUso, sql, []);

  return result.rows;
}
