import {
  AUXILIAR_INSTANCES,
  DIRECTIVO_INSTANCES,
  PERSONAL_ADMIN_INSTANCES,
  PROFESOR_PRIMARIA_INSTANCES,
  PROFESOR_SECUNDARIA_INSTANCES,
  TUTOR_INSTANCES,
} from "../../../constants/RDP02_INSTANCES_DISTRIBUTION";
import { RDP02 } from "../../../interfaces/shared/RDP02Instancias";
import { RolesSistema } from "../../../interfaces/shared/RolesSistema";

/**
 * Obtiene las instancias disponibles para un rol específico
 * @param rol El rol del sistema
 * @returns Array de instancias disponibles para ese rol
 */
export function getRDP02InstancesForThisRol(rol: RolesSistema): RDP02[] {
  switch (rol) {
    case RolesSistema.Directivo:
      return DIRECTIVO_INSTANCES;
    case RolesSistema.Auxiliar:
      return AUXILIAR_INSTANCES;
    case RolesSistema.ProfesorSecundaria:
      return PROFESOR_SECUNDARIA_INSTANCES;
    case RolesSistema.Tutor:
      return TUTOR_INSTANCES;
    case RolesSistema.ProfesorPrimaria:
      return PROFESOR_PRIMARIA_INSTANCES;
    case RolesSistema.PersonalAdministrativo:
      return PERSONAL_ADMIN_INSTANCES;
    case RolesSistema.Responsable:
      return [];
    default:
      console.warn(`Rol ${rol} no reconocido`);
      return [];
  }
}
