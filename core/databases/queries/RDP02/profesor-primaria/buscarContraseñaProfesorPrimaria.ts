import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { buscarProfesorPrimariaPorIdSelect } from "./buscarProfesorPrimariaPorId";

export async function buscarContraseñaProfesorPrimaria(
  idProfesorPrimaria: string,
  instanciaEnUso?: RDP02
): Promise<string | null> {
  const profesorPrimaria = await buscarProfesorPrimariaPorIdSelect(
    idProfesorPrimaria,
    ["Contraseña"],
    instanciaEnUso
  );
  return profesorPrimaria ? profesorPrimaria.Contraseña : null;
}
