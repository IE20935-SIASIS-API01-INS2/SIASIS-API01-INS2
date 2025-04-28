import { RolesSistema } from "../../../interfaces/shared/RolesSistema";
import { getRDP02DatabaseURLForThisInstance } from "./getRDP02DatabaseURLForThisInstance";
import { getRDP02InstancesForThisRol } from "./getRDP02InstancesForThisRol";

/**
 * Obtiene una URL de conexión aleatoria para un rol específico
 * @param rol El rol del sistema
 * @returns URL de conexión aleatoria o null si no hay disponibles
 * @throws Error si el rol no tiene acceso a ninguna instancia
 */
export function getRandomDatabaseURLForThisRole(
  rol: RolesSistema
): string | null {
  // Si es Responsable, devolver error
  if (rol === RolesSistema.Responsable) {
    throw new Error(
      "El rol Responsable no tiene acceso a ninguna instancia de base de datos"
    );
  }

  // Obtener instancias disponibles para este rol
  const availableInstances = getRDP02InstancesForThisRol(rol);

  // Verificar si hay instancias disponibles
  if (availableInstances.length === 0) {
    console.warn(`No hay instancias configuradas para el rol ${rol}`);
    return null;
  }

  // Seleccionar una instancia al azar (usando Math.floor para asegurar que el índice esté dentro del rango)
  const randomIndex = Math.floor(Math.random() * availableInstances.length);
  const selectedInstance = availableInstances[randomIndex];

  // Obtener la URL de conexión para la instancia seleccionada
  return getRDP02DatabaseURLForThisInstance(selectedInstance);
}