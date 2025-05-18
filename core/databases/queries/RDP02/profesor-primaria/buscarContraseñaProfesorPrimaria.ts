import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { buscarProfesorPrimariaPorDNISelect } from "./buscarProfesorPrimariaPorDNI";

export async function buscarContraseñaProfesorPrimaria(
  dniProfesorPrimaria: string,
  instanciaEnUso?: RDP02
): Promise<string | null> {
  const profesorPrimaria = await buscarProfesorPrimariaPorDNISelect(
    dniProfesorPrimaria,
    ["Contraseña"],
    instanciaEnUso
  );
  return profesorPrimaria ? profesorPrimaria.Contraseña : null;
}
