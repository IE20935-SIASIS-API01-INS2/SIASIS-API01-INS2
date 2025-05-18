// src/core/database/connectors/postgres.ts
import { Pool, QueryResult, QueryResultRow } from "pg";
import dotenv from "dotenv";
import {
  PG_CONNECTION_TIMEOUT,
  PG_IDLE_TIMEOUT,
  PG_MAX_CONNECTIONS,
} from "../../../src/constants/NEON_POSTGRES_CONFIG";
import { RolesSistema } from "../../../src/interfaces/shared/RolesSistema";
import { RDP02 } from "../../../src/interfaces/shared/RDP02Instancias";
import { getRDP02InstancesForThisRol } from "../../../src/lib/helpers/instances/getRDP02InstancesForThisRol";
import { esOperacionBDLectura } from "../../../src/lib/helpers/comprobations/esOperacionBDLectura";
import { getRDP02DatabaseURLForThisInstance } from "../../../src/lib/helpers/instances/getRDP02DatabaseURLForThisInstance";
import { getInstanciasRDP02AfectadasPorRoles } from "../../../src/lib/helpers/instances/getInstanciasRDP02AfectadasPorRoles";
import { consultarConEMCS01 } from "../../external/github/EMCS01/consultarConEMCS01";

dotenv.config();

// Mapa para almacenar pools de conexiones por URL
const poolMap = new Map<string, Pool>();

/**
 * Obtiene o crea un pool de conexiones para una URL específica
 * @param connectionURL URL de conexión a la base de datos
 * @returns Pool de conexiones
 */
function getOrCreatePool(connectionURL: string): Pool {
  // Verificar si ya existe un pool para esta URL
  let pool = poolMap.get(connectionURL);

  if (!pool) {
    // Crear nuevo pool con las configuraciones
    pool = new Pool({
      connectionString: connectionURL,
      max: parseInt(PG_MAX_CONNECTIONS || "3", 10),
      idleTimeoutMillis: parseInt(PG_IDLE_TIMEOUT || "10000", 10),
      connectionTimeoutMillis: parseInt(PG_CONNECTION_TIMEOUT || "5000", 10),
      ssl: true,
    });

    // Agregar manejador de errores
    pool.on("error", (err) => {
      console.error("Error inesperado en el pool:", err);
    });

    // Almacenar pool para reutilización
    poolMap.set(connectionURL, pool);
  }

  return pool;
}

/**
 * Obtiene una instancia aleatoria para un rol específico
 * @param rol Rol del sistema
 * @returns Instancia aleatoria
 */
function getRandomInstanceForRole(rol: RolesSistema): RDP02 {
  // Obtener instancias disponibles para el rol
  const instances = getRDP02InstancesForThisRol(rol);

  if (instances.length === 0) {
    throw new Error(`No hay instancias configuradas para el rol ${rol}`);
  }

  // Seleccionar una instancia aleatoria
  const randomIndex = Math.floor(Math.random() * instances.length);
  return instances[randomIndex];
}

/**
 * Obtiene una instancia aleatoria de cualquiera de las disponibles
 * @returns Instancia aleatoria de entre todas las configuradas
 */
function getRandomInstance(): RDP02 {
  // Obtener todas las instancias disponibles
  const allInstances = Object.values(RDP02);

  if (allInstances.length === 0) {
    throw new Error("No hay instancias configuradas en el sistema");
  }

  // Seleccionar una instancia aleatoria
  const randomIndex = Math.floor(Math.random() * allInstances.length);
  return allInstances[randomIndex];
}

/**
 * Ejecuta una consulta SQL en la base de datos
 * @param instanciaEnUso Instancia donde se ejecutará la consulta inicialmente (opcional para lecturas)
 * @param text Consulta SQL
 * @param params Parámetros de la consulta
 * @param rol Rol del usuario que ejecuta la consulta (opcional para lecturas)
 * @param rolesAfectados Roles cuyos datos serán afectados (opcional para operaciones de escritura, por defecto afecta a todos)
 * @returns Resultado de la consulta
 */
export async function query<T extends QueryResultRow = any>(
  instanciaEnUso: RDP02 | undefined,
  text: string,
  params: any[] = [],
  rol?: RolesSistema,
  rolesAfectados?: RolesSistema[]
): Promise<QueryResult<T>> {
  // Determinar si es operación de lectura o escritura
  const isRead = esOperacionBDLectura(text);

  // Validar los parámetros según el tipo de operación
  if (isRead) {
    // Para operaciones de LECTURA
    if (instanciaEnUso === undefined) {
      // Si hay rol especificado, seleccionar instancia para ese rol
      if (rol) {
        instanciaEnUso = getRandomInstanceForRole(rol);
        console.log(
          `Operación de lectura: Seleccionada instancia aleatoria ${instanciaEnUso} para rol ${rol}`
        );
      }
      // Si no hay rol especificado, seleccionar cualquier instancia
      else {
        instanciaEnUso = getRandomInstance();
        console.log(
          `Operación de lectura: Seleccionada instancia aleatoria ${instanciaEnUso} (sin rol específico)`
        );
      }
    }
  } else {
    // Para operaciones de ESCRITURA
    if (instanciaEnUso === undefined) {
      throw new Error(
        "Para operaciones de escritura, se requiere especificar una instancia"
      );
    }

    // Si no se proporcionan roles afectados, considerar que afecta a todos los roles
    if (!rolesAfectados || rolesAfectados.length === 0) {
      rolesAfectados = Object.values(RolesSistema);
      console.log(
        "No se especificaron roles afectados. Considerando que afecta a TODOS los roles."
      );
    }
  }

  // Obtener la URL de conexión para la instancia en uso
  const connectionURL = getRDP02DatabaseURLForThisInstance(instanciaEnUso);

  // Verificar si se obtuvo una URL válida
  if (!connectionURL) {
    throw new Error(
      `No hay URL de conexión disponible para la instancia ${instanciaEnUso}`
    );
  }

  // Obtener o crear un pool para esta URL
  const pool = getOrCreatePool(connectionURL);

  try {
    // Obtener cliente del pool
    const client = await pool.connect();

    try {
      // Registrar inicio de la consulta
      const start = Date.now();

      // Ejecutar la consulta en la instancia en uso
      const result = await client.query(text, params);

      // Calcular duración
      const duration = Date.now() - start;

      // Si estamos en entorno de desarrollo, imprimir logs
      if (process.env.ENTORNO === "D") {
        // Registrar información de la consulta
        console.log(`Query ejecutada en instancia ${instanciaEnUso}`, {
          operacion: isRead ? "Lectura" : "Escritura",
          text: text.substring(0, 80) + (text.length > 80 ? "..." : ""),
          duration,
          filas: result.rowCount,
        });
      }

      // Si es una operación de escritura, replicar en las demás instancias a través del webhook
      if (!isRead && rolesAfectados && rolesAfectados.length > 0) {
        // Obtener las instancias afectadas (únicas y excluyendo la instancia en uso)
        const instanciasAActualizar = getInstanciasRDP02AfectadasPorRoles(
          rolesAfectados,
          instanciaEnUso
        );

        // Si hay instancias para actualizar, enviar el webhook
        if (instanciasAActualizar.length > 0) {
          console.log(
            `Replicando operación de escritura en: ${instanciasAActualizar.join(
              ", "
            )}`
          );

          // Ejecutar EMCS01 si no nos encontramos en entorno local
          await consultarConEMCS01(text, params, instanciasAActualizar).catch(
            (err) => console.error("Error en replicación asíncrona:", err)
          );
        }
      }

      return result;
    } finally {
      // Siempre liberar el cliente
      client.release();
    }
  } catch (error) {
    console.error(
      `Error ejecutando consulta en instancia ${instanciaEnUso}:`,
      error
    );
    throw error;
  }
}

/**
 * Ejecuta una transacción en la base de datos
 * @param instanciaEnUso Instancia donde se ejecutará la transacción (obligatorio)
 * @param callback Función que contiene las operaciones de la transacción
 * @param rolesAfectados Roles cuyos datos serán afectados (opcional, por defecto afecta a todos)
 * @returns Resultado de la transacción
 */
export async function transaction<T = any>(
  instanciaEnUso: RDP02,
  callback: (client: any) => Promise<T>,
  rolesAfectados?: RolesSistema[]
): Promise<T> {
  // Validar parámetros requeridos
  if (!instanciaEnUso) {
    throw new Error(
      "Para transacciones, se requiere especificar una instancia"
    );
  }

  // Si no se proporcionan roles afectados, considerar que afecta a todos los roles
  if (!rolesAfectados || rolesAfectados.length === 0) {
    rolesAfectados = Object.values(RolesSistema);
    console.log(
      "No se especificaron roles afectados en la transacción. Considerando que afecta a TODOS los roles."
    );
  }

  // Obtener la URL de conexión para la instancia en uso
  const connectionURL = getRDP02DatabaseURLForThisInstance(instanciaEnUso);

  // Verificar si se obtuvo una URL válida
  if (!connectionURL) {
    throw new Error(
      `No hay URL de conexión disponible para la instancia ${instanciaEnUso}`
    );
  }

  // Obtener o crear un pool para esta URL
  const pool = getOrCreatePool(connectionURL);

  // Obtener cliente para la transacción
  const client = await pool.connect();

  // Array para almacenar consultas de escritura
  const writeQueries: { text: string; params: any[] }[] = [];

  // Variable para controlar si el cliente ya fue liberado
  let clientReleased = false;

  try {
    // Iniciar transacción
    await client.query("BEGIN");

    // Crear proxy para interceptar consultas de escritura
    const enhancedClient = new Proxy(client, {
      get(target, prop, receiver) {
        // Solo interceptamos el método query
        if (prop === "query") {
          // Devolvemos una función que reemplaza a query
          return async function (textOrConfig: any, values?: any) {
            // Extraer información según el tipo de llamada
            let text: string | undefined;
            let params: any[] = [];

            if (typeof textOrConfig === "string") {
              text = textOrConfig;
              params = values || [];
            } else if (textOrConfig && typeof textOrConfig === "object") {
              text = textOrConfig.text || textOrConfig.name;
              params = textOrConfig.values || [];
            }

            // Ejecutar la consulta original
            const result = await target.query(textOrConfig, values);

            // Capturar solo consultas de escritura
            if (text && !esOperacionBDLectura(text)) {
              writeQueries.push({ text, params });
            }

            return result;
          };
        }

        // Para cualquier otra propiedad, devolvemos el valor original
        return Reflect.get(target, prop, receiver);
      },
    });

    // Ejecutar callback con el cliente proxy
    const result = await callback(enhancedClient);

    // Confirmar transacción
    await client.query("COMMIT");

    // Si hay consultas de escritura, replicar en las demás instancias
    if (writeQueries.length > 0) {
      // Obtener las instancias afectadas
      const instanciasAActualizar = getInstanciasRDP02AfectadasPorRoles(
        rolesAfectados,
        instanciaEnUso
      );

      // Si hay instancias para actualizar, enviar webhook para cada consulta
      if (instanciasAActualizar.length > 0) {
        console.log(
          `Replicando transacción en: ${instanciasAActualizar.join(", ")}`
        );

        for (const { text, params } of writeQueries) {
          consultarConEMCS01(text, params, instanciasAActualizar).catch((err) =>
            console.error("Error en replicación asíncrona de transacción:", err)
          );
        }
      }
    }

    return result;
  } catch (error) {
    // Revertir transacción en caso de error
    if (!clientReleased) {
      await client.query("ROLLBACK").catch((err) => {
        console.error("Error durante rollback:", err);
      });
    }

    console.error(
      `Error en transacción en instancia ${instanciaEnUso}:`,
      error
    );

    throw error;
  } finally {
    // Siempre liberar el cliente si no ha sido liberado
    if (!clientReleased) {
      client.release();
      clientReleased = true;
    }
  }
}

/**
 * Cliente de PostgreSQL que facilita operaciones con múltiples instancias
 */
export const postgresClient = {
  /**
   * Ejecuta una consulta de lectura en una instancia específica o aleatoria para un rol
   * @param text Consulta SQL (debe ser de lectura)
   * @param params Parámetros de la consulta
   * @param options Opciones adicionales: instancia específica o rol para seleccionar instancia
   * @returns Resultado de la consulta
   */
  read: async <T extends QueryResultRow = any>(
    text: string,
    params: any[] = [],
    options: { instancia?: RDP02; rol?: RolesSistema } = {}
  ): Promise<QueryResult<T>> => {
    // Verificar que sea una operación de lectura
    if (!esOperacionBDLectura(text)) {
      throw new Error(
        "Este método solo debe usarse para operaciones de lectura"
      );
    }

    // Ejecutar la consulta
    return await query<T>(options.instancia, text, params, options.rol);
  },

  /**
   * Ejecuta una operación de escritura en una instancia específica y la replica en otras instancias relevantes
   * @param instancia Instancia donde se ejecutará inicialmente la operación (obligatorio)
   * @param text Consulta SQL (debe ser de escritura)
   * @param params Parámetros de la consulta
   * @param rolesAfectados Roles cuyos datos serán afectados (opcional, por defecto afecta a todos)
   * @returns Resultado de la operación
   */
  write: async <T extends QueryResultRow = any>(
    instancia: RDP02,
    text: string,
    params: any[] = [],
    rolesAfectados?: RolesSistema[]
  ): Promise<QueryResult<T>> => {
    // Verificar que sea una operación de escritura
    if (esOperacionBDLectura(text)) {
      throw new Error(
        "Este método solo debe usarse para operaciones de escritura"
      );
    }

    // Validar parámetros requeridos
    if (!instancia) {
      throw new Error(
        "Para operaciones de escritura, se requiere especificar una instancia"
      );
    }

    // Si no se proporcionan roles afectados, se usará por defecto todos los roles en la función query

    // Ejecutar la consulta
    return await query<T>(instancia, text, params, undefined, rolesAfectados);
  },

  /**
   * Ejecuta una transacción en una instancia específica y replica las operaciones de escritura
   * @param instancia Instancia donde se ejecutará la transacción (obligatorio)
   * @param callback Función que contiene las operaciones de la transacción
   * @param rolesAfectados Roles cuyos datos serán afectados (opcional, por defecto afecta a todos)
   * @returns Resultado de la transacción
   */
  transaction: async <T = any>(
    instancia: RDP02,
    callback: (client: any) => Promise<T>,
    rolesAfectados?: RolesSistema[]
  ): Promise<T> => {
    return await transaction<T>(instancia, callback, rolesAfectados);
  },

  /**
   * Cierra todos los pools de conexiones
   */
  closeAllConnections: async (): Promise<void> => {
    await closeAllPools();
  },
};

/**
 * Cierra todos los pools de conexiones
 */
export async function closeAllPools(): Promise<void> {
  const closePromises = Array.from(poolMap.entries()).map(
    async ([url, pool]) => {
      try {
        await pool.end();
        console.log(`Pool cerrado para URL: ${url.substring(0, 20)}...`);
      } catch (error) {
        console.error(`Error al cerrar pool: ${error}`);
      }
    }
  );

  // Esperar a que todos los pools se cierren
  await Promise.all(closePromises);

  // Limpiar el mapa
  poolMap.clear();

  console.log("Todos los pools de conexión han sido cerrados");
}
