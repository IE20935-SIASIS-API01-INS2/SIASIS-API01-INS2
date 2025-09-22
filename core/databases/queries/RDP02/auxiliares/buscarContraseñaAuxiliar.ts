import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { buscarAuxiliarPorIdSelect } from "./buscarAuxiliarPorId";

export async function buscarContraseñaAuxiliar(
  idAuxiliar: string,
  instanciaEnUso?: RDP02
): Promise<string | null> {
  const auxiliar = await buscarAuxiliarPorIdSelect(
    idAuxiliar,
    ["Contraseña"],
    instanciaEnUso
  );
  return auxiliar ? auxiliar.Contraseña : null;
}
