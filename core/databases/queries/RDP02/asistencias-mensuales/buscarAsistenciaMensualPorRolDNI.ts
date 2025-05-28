import { AsistenciaMensualPersonal } from "../../../../../src/interfaces/shared/AsistenciaRequests";
import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { RolesSistema } from "../../../../../src/interfaces/shared/RolesSistema";
import { query } from "../../../connectors/postgres";

/**
 * Busca asistencias mensuales de profesores de primaria CON IDs
 */
export async function buscarAsistenciaMensualProfesorPrimaria(
  dni: string,
  mes: number,
  instanciaEnUso?: RDP02
): Promise<AsistenciaMensualPersonal | null> {
  const sqlEntradas = `
    SELECT 
      "Id_C_E_M_P_Profesores_Primaria",
      "Entradas"
    FROM "T_Control_Entrada_Mensual_Profesores_Primaria"
    WHERE "DNI_Profesor_Primaria" = $1 AND "Mes" = $2
    LIMIT 1
  `;

  const sqlSalidas = `
    SELECT 
      "Id_C_E_M_P_Profesores_Primaria",
      "Salidas"
    FROM "T_Control_Salida_Mensual_Profesores_Primaria"
    WHERE "DNI_Profesor_Primaria" = $1 AND "Mes" = $2
    LIMIT 1
  `;

  const [resultEntradas, resultSalidas] = await Promise.all([
    query(instanciaEnUso, sqlEntradas, [dni, mes]),
    query(instanciaEnUso, sqlSalidas, [dni, mes]),
  ]);

  // Si no hay registros de entradas ni salidas, retornar null
  if (resultEntradas.rows.length === 0 && resultSalidas.rows.length === 0) {
    return null;
  }

  return {
    Entradas: resultEntradas.rows[0]?.Entradas || "{}",
    Salidas: resultSalidas.rows[0]?.Salidas || "{}",
    Id_Registro_Mensual_Entrada: resultEntradas.rows[0]?.Id_C_E_M_P_Profesores_Primaria || 0,
    Id_Registro_Mensual_Salida: resultSalidas.rows[0]?.Id_C_E_M_P_Profesores_Primaria || 0,
  };
}

/**
 * Busca asistencias mensuales de profesores de secundaria CON IDs
 */
export async function buscarAsistenciaMensualProfesorSecundaria(
  dni: string,
  mes: number,
  instanciaEnUso?: RDP02
): Promise<AsistenciaMensualPersonal | null> {
  const sqlEntradas = `
    SELECT 
      "Id_C_E_M_P_Profesores_Secundaria",
      "Entradas"
    FROM "T_Control_Entrada_Mensual_Profesores_Secundaria"
    WHERE "DNI_Profesor_Secundaria" = $1 AND "Mes" = $2
    LIMIT 1
  `;

  const sqlSalidas = `
    SELECT 
      "Id_C_E_M_P_Profesores_Secundaria", 
      "Salidas"
    FROM "T_Control_Salida_Mensual_Profesores_Secundaria"
    WHERE "DNI_Profesor_Secundaria" = $1 AND "Mes" = $2
    LIMIT 1
  `;

  const [resultEntradas, resultSalidas] = await Promise.all([
    query(instanciaEnUso, sqlEntradas, [dni, mes]),
    query(instanciaEnUso, sqlSalidas, [dni, mes]),
  ]);

  if (resultEntradas.rows.length === 0 && resultSalidas.rows.length === 0) {
    return null;
  }

  return {
    Entradas: resultEntradas.rows[0]?.Entradas || "{}",
    Salidas: resultSalidas.rows[0]?.Salidas || "{}",
    Id_Registro_Mensual_Entrada: resultEntradas.rows[0]?.Id_C_E_M_P_Profesores_Secundaria || 0,
    Id_Registro_Mensual_Salida: resultSalidas.rows[0]?.Id_C_E_M_P_Profesores_Secundaria || 0,
  };
}

/**
 * Busca asistencias mensuales de auxiliares CON IDs
 */
export async function buscarAsistenciaMensualAuxiliar(
  dni: string,
  mes: number,
  instanciaEnUso?: RDP02
): Promise<AsistenciaMensualPersonal | null> {
  const sqlEntradas = `
    SELECT 
      "Id_C_E_M_P_Auxiliar",
      "Entradas"
    FROM "T_Control_Entrada_Mensual_Auxiliar"
    WHERE "DNI_Auxiliar" = $1 AND "Mes" = $2
    LIMIT 1
  `;

  const sqlSalidas = `
    SELECT 
      "Id_C_E_M_P_Auxiliar",
      "Salidas"
    FROM "T_Control_Salida_Mensual_Auxiliar"
    WHERE "DNI_Auxiliar" = $1 AND "Mes" = $2
    LIMIT 1
  `;

  const [resultEntradas, resultSalidas] = await Promise.all([
    query(instanciaEnUso, sqlEntradas, [dni, mes]),
    query(instanciaEnUso, sqlSalidas, [dni, mes]),
  ]);

  if (resultEntradas.rows.length === 0 && resultSalidas.rows.length === 0) {
    return null;
  }

  return {
    Entradas: resultEntradas.rows[0]?.Entradas || "{}",
    Salidas: resultSalidas.rows[0]?.Salidas || "{}",
    Id_Registro_Mensual_Entrada: resultEntradas.rows[0]?.Id_C_E_M_P_Auxiliar || 0,
    Id_Registro_Mensual_Salida: resultSalidas.rows[0]?.Id_C_E_M_P_Auxiliar || 0,
  };
}

/**
 * Busca asistencias mensuales de personal administrativo CON IDs
 */
export async function buscarAsistenciaMensualPersonalAdministrativo(
  dni: string,
  mes: number,
  instanciaEnUso?: RDP02
): Promise<AsistenciaMensualPersonal | null> {
  const sqlEntradas = `
    SELECT 
      "Id_C_E_M_P_Administrativo",
      "Entradas"
    FROM "T_Control_Entrada_Mensual_Personal_Administrativo"
    WHERE "DNI_Personal_Administrativo" = $1 AND "Mes" = $2
    LIMIT 1
  `;

  const sqlSalidas = `
    SELECT 
      "Id_C_E_M_P_Administrativo",
      "Salidas"
    FROM "T_Control_Salida_Mensual_Personal_Administrativo"
    WHERE "DNI_Personal_Administrativo" = $1 AND "Mes" = $2
    LIMIT 1
  `;

  const [resultEntradas, resultSalidas] = await Promise.all([
    query(instanciaEnUso, sqlEntradas, [dni, mes]),
    query(instanciaEnUso, sqlSalidas, [dni, mes]),
  ]);

  if (resultEntradas.rows.length === 0 && resultSalidas.rows.length === 0) {
    return null;
  }

  return {
    Entradas: resultEntradas.rows[0]?.Entradas || "{}",
    Salidas: resultSalidas.rows[0]?.Salidas || "{}",
    Id_Registro_Mensual_Entrada: resultEntradas.rows[0]?.Id_C_E_M_P_Administrativo || 0,
    Id_Registro_Mensual_Salida: resultSalidas.rows[0]?.Id_C_E_M_P_Administrativo || 0,
  };
}

/**
 * Función principal que busca asistencias según el rol CON IDs
 */
export async function buscarAsistenciaMensualPorRol(
  rol: RolesSistema,
  dni: string,
  mes: number,
  instanciaEnUso?: RDP02
): Promise<AsistenciaMensualPersonal | null> {
  switch (rol) {
    case RolesSistema.ProfesorPrimaria:
      return await buscarAsistenciaMensualProfesorPrimaria(
        dni,
        mes,
        instanciaEnUso
      );

    case RolesSistema.ProfesorSecundaria:
    case RolesSistema.Tutor:
      return await buscarAsistenciaMensualProfesorSecundaria(
        dni,
        mes,
        instanciaEnUso
      );

    case RolesSistema.Auxiliar:
      return await buscarAsistenciaMensualAuxiliar(dni, mes, instanciaEnUso);

    case RolesSistema.PersonalAdministrativo:
      return await buscarAsistenciaMensualPersonalAdministrativo(
        dni,
        mes,
        instanciaEnUso
      );

    case RolesSistema.Directivo:
    case RolesSistema.Responsable:
      // Directivos y Responsables no tienen control de asistencia
      return null;

    default:
      throw new Error(`Rol no soportado para control de asistencia: ${rol}`);
  }
}
