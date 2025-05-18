import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { buscarDirectivoPorIdSelect } from "./buscarDirectivoPorId";

// En lugar de crear una función específica como buscarContraseñaDirectivo
export async function buscarContraseñaDirectivo(
  idDirectivo: number,
  instanciaEnUso?: RDP02
): Promise<string | null> {
  const directivo = await buscarDirectivoPorIdSelect(
    idDirectivo,
    ["Contraseña"],
    instanciaEnUso
  );
  return directivo ? directivo.Contraseña : null;
}
