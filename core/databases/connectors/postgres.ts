// src/core/database/connectors/postgres.ts
import { Pool, QueryResult } from "pg";
import dotenv from "dotenv";
import {
  PG_CONNECTION_TIMEOUT,
  PG_IDLE_TIMEOUT,
  PG_MAX_CONNECTIONS,
} from "../../../src/constants/NEON_POSTGRES_CONFIG";
import { RolesSistema } from "../../../src/interfaces/shared/RolesSistema";
import { RDP02 } from "../../../src/interfaces/shared/RDP02Instancias";
import { getRDP02DatabaseURLForThisInstance } from "../../../src/lib/helpers/instances/getRDP02DatabaseURLForThisInstance";
import { getInstanciasRDP02AfectadasPorRoles } from "../../../src/lib/helpers/instances/getInstanciasRDP02AfectadasPorRoles";
import { esOperacionBDLectura } from "../../../src/lib/helpers/comprobations/esOperacionBDLectura";
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
 * Ejecuta una consulta SQL en la base de datos
 * @param instanciaEnUso Instancia donde se ejecutará la consulta inicialmente
 * @param text Consulta SQL
 * @param params Parámetros de la consulta
 * @param rolesAfectados Roles cuyos datos serán afectados (solo necesario para operaciones de escritura)
 * @returns Resultado de la consulta
 */
export async function query(
  instanciaEnUso: RDP02,
  text: string,
  params: any[] = [],
  rolesAfectados?: RolesSistema[]
): Promise<QueryResult> {
  // Determinar si es operación de lectura o escritura
  const isRead = esOperacionBDLectura(text);

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

      // Registrar información de la consulta
      console.log(`Query ejecutada en instancia ${instanciaEnUso}`, {
        operacion: isRead ? "Lectura" : "Escritura",
        text: text.substring(0, 80) + (text.length > 80 ? "..." : ""),
        duration,
        filas: result.rowCount,
      });

      // Si es una operación de escritura y se proporcionaron roles afectados,
      // replicar en las demás instancias a través del webhook
      if (!isRead && rolesAfectados && rolesAfectados.length > 0) {
        // Obtener las instancias afectadas (únicas y excluyendo la instancia en uso)
        const instanciasAActualizar = getInstanciasRDP02AfectadasPorRoles(
          rolesAfectados,
          instanciaEnUso
        );

        // Si hay instancias para actualizar, enviar el webhook
        if (instanciasAActualizar.length > 0) {
          // Ejecutar de forma asíncrona para no retrasar la respuesta
          consultarConEMCS01(
            text,
            params,
            instanciasAActualizar
          ).catch((err) =>
            console.error("Error en replicación asíncrona:", err)
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
 * @param instanciaEnUso Instancia donde se ejecutará la transacción
 * @param callback Función que contiene las operaciones de la transacción
 * @param rolesAfectados Roles cuyos datos serán afectados (opcional)
 * @returns Resultado de la transacción
 */
export async function transaction<T>(
  instanciaEnUso: RDP02,
  callback: (client: any) => Promise<T>,
  rolesAfectados?: RolesSistema[]
): Promise<T> {
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

    // Si hay roles afectados, usamos un proxy para interceptar las consultas
    let result: T;

    if (rolesAfectados && rolesAfectados.length > 0) {
      // Creamos un objeto proxy "mejorado" que captura las consultas de escritura
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
      result = await callback(enhancedClient);
    } else {
      // Si no hay roles afectados, simplemente ejecutamos el callback con el cliente original
      result = await callback(client);
    }

    // Confirmar transacción
    await client.query("COMMIT");

    // Si hay roles afectados y consultas de escritura, replicar en las demás instancias
    if (
      rolesAfectados &&
      rolesAfectados.length > 0 &&
      writeQueries.length > 0
    ) {
      // Obtener las instancias afectadas
      const instanciasAActualizar = getInstanciasRDP02AfectadasPorRoles(
        rolesAfectados,
        instanciaEnUso
      );

      // Si hay instancias para actualizar, enviar webhook para cada consulta
      if (instanciasAActualizar.length > 0) {
        for (const { text, params } of writeQueries) {
          consultarConEMCS01(
            text,
            params,
            instanciasAActualizar
          ).catch((err) =>
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
