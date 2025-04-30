// src/core/database/queries/profesores-primaria/profesorPrimariaQueries.ts
import { T_Profesores_Primaria } from "@prisma/client";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";


/**
 * Busca un profesor de primaria por su nombre de usuario
 * @param nombreUsuario Nombre de usuario del profesor de primaria
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos del profesor de primaria o null si no existe
 */
export async function buscarProfesorPrimariaPorNombreUsuario(
  nombreUsuario: string,
  instanciaEnUso?: RDP02
): Promise<T_Profesores_Primaria | null> {
  const sql = `
    SELECT *
    FROM "T_Profesores_Primaria"
    WHERE "Nombre_Usuario" = $1
  `;

  // Operación de lectura, sin necesidad de especificar rol
  const result = await query<T_Profesores_Primaria>(
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
 * Busca un profesor de primaria por su nombre de usuario y selecciona campos específicos
 * @param nombreUsuario Nombre de usuario del profesor de primaria
 * @param campos Campos específicos a seleccionar (keyof T_Profesores_Primaria)
 * @param instanciaEnUso Instancia específica donde ejecutar la consulta (opcional)
 * @returns Datos parciales del profesor de primaria o null si no existe
 */
export async function buscarProfesorPrimariaPorNombreUsuarioSelect<
  K extends keyof T_Profesores_Primaria
>(
  nombreUsuario: string,
  campos: K[],
  instanciaEnUso?: RDP02
): Promise<Pick<T_Profesores_Primaria, K> | null> {
  // Construir la consulta SQL con los campos especificados
  const camposStr = campos.map((campo) => `"${String(campo)}"`).join(", ");

  const sql = `
    SELECT ${camposStr}
    FROM "T_Profesores_Primaria"
    WHERE "Nombre_Usuario" = $1
  `;

  // Operación de lectura, sin necesidad de especificar rol
  const result = await query<Pick<T_Profesores_Primaria, K>>(
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

