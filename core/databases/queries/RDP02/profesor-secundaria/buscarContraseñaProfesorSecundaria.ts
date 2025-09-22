import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { buscarProfesorSecundariaPorIdSelect } from "./buscarProfesorSecundariaPorId";

export async function buscarContraseñaProfesorSecundaria(
  idProfesorSecundaria: string,
  instanciaEnUso?: RDP02
): Promise<string | null> {
  const profesorSecundaria = await buscarProfesorSecundariaPorIdSelect(
    idProfesorSecundaria,
    ["Contraseña"],
    instanciaEnUso
  );
  return profesorSecundaria ? profesorSecundaria.Contraseña : null;
}
