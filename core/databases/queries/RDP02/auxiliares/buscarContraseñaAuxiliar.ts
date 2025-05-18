import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { buscarAuxiliarPorDNISelect } from "./buscarAuxiliarPorDNI";

export async function buscarContraseñaAuxiliar(
  dniAuxiliar: string,
  instanciaEnUso?: RDP02
): Promise<string | null> {
  const auxiliar = await buscarAuxiliarPorDNISelect(
    dniAuxiliar,
    ["Contraseña"],
    instanciaEnUso
  );
  return auxiliar ? auxiliar.Contraseña : null;
}
