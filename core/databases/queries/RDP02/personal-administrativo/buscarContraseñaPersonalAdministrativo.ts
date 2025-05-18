import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { buscarPersonalAdministrativoPorDNISelect } from "./buscarPersonalAdministrativoPorDNI";

export async function buscarContraseñaPersonalAdministrativo(
  dniPersonalAdministrativo: string,
  instanciaEnUso?: RDP02
): Promise<string | null> {
  const personalAdministrativo = await buscarPersonalAdministrativoPorDNISelect(
    dniPersonalAdministrativo,
    ["Contraseña"],
    instanciaEnUso
  );
  return personalAdministrativo ? personalAdministrativo.Contraseña : null;
}
