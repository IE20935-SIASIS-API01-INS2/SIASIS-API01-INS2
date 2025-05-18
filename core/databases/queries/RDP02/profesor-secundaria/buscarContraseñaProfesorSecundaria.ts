import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { buscarProfesorSecundariaPorDNISelect } from "./buscarProfesorSecundariaPorDNI";

export async function buscarContraseñaProfesorSecundaria(
  dniProfesorSecundaria: string,
  instanciaEnUso?: RDP02
): Promise<string | null> {
  const profesorSecundaria = await buscarProfesorSecundariaPorDNISelect(
    dniProfesorSecundaria,
    ["Contraseña"],
    instanciaEnUso
  );
  return profesorSecundaria ? profesorSecundaria.Contraseña : null;
}
