export enum TiposIdentificadores {
  DNI = 1,
  CARNET_EXTRANJERIA = 2,
  CODIGO_ESCUELA = 3
}

export const TiposIdentificadoresTextos: Record<TiposIdentificadores, string> = {
  [TiposIdentificadores.DNI]: "DNI",
  [TiposIdentificadores.CARNET_EXTRANJERIA]: "Carnet de Extranjería",
  [TiposIdentificadores.CODIGO_ESCUELA]: "Código de Escuela",
};
