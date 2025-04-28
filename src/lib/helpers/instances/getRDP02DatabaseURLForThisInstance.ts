import { RDP02 } from "../../../interfaces/shared/RDP02Instancias";
import { RDP02_INSTANCES_DATABASE_URL_MAP } from '../../../constants/RDP02_INSTANCES_DISTRIBUTION';

/**
 * Obtiene la URL de conexión a la base de datos para una instancia específica
 * @param instance La instancia de la base de datos
 * @returns La URL de conexión o null si no está definida
 */
export function getRDP02DatabaseURLForThisInstance(instance: RDP02): string | null {
  // Obtener la URL de conexión directamente del mapa
  const connectionURL = RDP02_INSTANCES_DATABASE_URL_MAP.get(instance);

  if (!connectionURL) {
    console.warn(
      `No hay URL de conexión disponible para la instancia ${instance}`
    );
    return null;
  }

  return connectionURL;
}
