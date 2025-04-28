import { RDP02 } from "../../../interfaces/shared/RDP02Instancias";
import { RolesSistema } from "../../../interfaces/shared/RolesSistema";
import { getRDP02InstancesForThisRol } from "./getRDP02InstancesForThisRol";

/**
 * Obtiene todas las instancias afectadas por un conjunto de roles
 * @param rolesAfectados Array de roles cuyos datos serán afectados
 * @param instanciaEnUso Instancia que ya se está utilizando y debe excluirse
 * @returns Array de instancias únicas afectadas, excluyendo la instancia en uso
 */
export function getInstanciasRDP02AfectadasPorRoles(
  rolesAfectados: RolesSistema[],
  instanciaEnUso: RDP02
): RDP02[] {
  // Conjunto para almacenar instancias únicas
  const instanciasSet = new Set<RDP02>();

  // Agregar todas las instancias de cada rol al conjunto
  for (const rol of rolesAfectados) {
    const instanciasDeRol = getRDP02InstancesForThisRol(rol);
    for (const instancia of instanciasDeRol) {
      instanciasSet.add(instancia);
    }
  }

  // Eliminar la instancia en uso del conjunto
  instanciasSet.delete(instanciaEnUso);

  // Convertir el conjunto a array
  return Array.from(instanciasSet);
}
