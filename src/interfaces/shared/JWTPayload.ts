import {
  T_Auxiliares,
  T_Directivos,
  T_Personal_Administrativo,
  T_Profesores_Primaria,
  T_Profesores_Secundaria,
} from "@prisma/client";
import { RolesSistema } from "./RolesSistema";
import { RDP02 } from "./RDP02Instancias";
import { RDP03 } from "./RDP03Instancias";

export interface JWTPayload {
  ID_Usuario: string;
  Rol: RolesSistema;
  RDP02_INSTANCE?: RDP02;
  RDP03_INSTANCE?: RDP03;
  Nombre_Usuario: string;
  iat: number;
  exp: number;
}

export type DirectivoAuthenticated = Pick<T_Directivos, "Id_Directivo"> &
  Pick<JWTPayload, "Nombre_Usuario">;

export type ProfesorPrimariaAuthenticated = Pick<
  T_Profesores_Primaria,
  "Id_Profesor_Primaria"
> &
  Pick<JWTPayload, "Nombre_Usuario">;

export type AuxiliarAuthenticated = Pick<T_Auxiliares, "Id_Auxiliar"> &
  Pick<JWTPayload, "Nombre_Usuario">;

export type ProfesorTutorSecundariaAuthenticated = Pick<
  T_Profesores_Secundaria,
  "Id_Profesor_Secundaria"
> &
  Pick<JWTPayload, "Nombre_Usuario">;



export type PersonalAdministrativoAuthenticated = Pick<
  T_Personal_Administrativo,
  "Id_Personal_Administrativo"
> &
  Pick<JWTPayload, "Nombre_Usuario">;

export type UserAuthenticatedAPI01 =
  | DirectivoAuthenticated
  | ProfesorPrimariaAuthenticated
  | AuxiliarAuthenticated
  | ProfesorTutorSecundariaAuthenticated
  | PersonalAdministrativoAuthenticated;