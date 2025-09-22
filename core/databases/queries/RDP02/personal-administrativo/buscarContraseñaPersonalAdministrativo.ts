import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { buscarPersonalAdministrativoPorIdSelect } from "./buscarPersonalAdministrativoPorId";

export async function buscarContraseñaPersonalAdministrativo(
  idPersonalAdministrativo: string,
  instanciaEnUso?: RDP02
): Promise<string | null> {
  const personalAdministrativo = await buscarPersonalAdministrativoPorIdSelect(
    idPersonalAdministrativo,
    ["Contraseña"],
    instanciaEnUso
  );
  return personalAdministrativo ? personalAdministrativo.Contraseña : null;
}
