import {
  T_Auxiliares,
  T_Directivos,
  T_Personal_Administrativo,
  T_Profesores_Primaria,
  T_Profesores_Secundaria,
} from "@prisma/client";
import { Genero } from "./Genero";
import { RolesSistema } from "./RolesSistema";

export type DirectivoGenerico = Pick<
  T_Directivos,
  | "Id_Directivo"
  | "Identificador_Nacional"
  | "Nombres"
  | "Apellidos"
  | "Genero"
  | "Google_Drive_Foto_ID"
>;

export type AuxiliarGenerico = Pick<
  T_Auxiliares,
  "Id_Auxiliar" | "Nombres" | "Apellidos" | "Genero" | "Google_Drive_Foto_ID"
>;

export type ProfesorPrimariaGenerico = Pick<
  T_Profesores_Primaria,
  | "Id_Profesor_Primaria"
  | "Nombres"
  | "Apellidos"
  | "Genero"
  | "Google_Drive_Foto_ID"
>;

export type ProfesorSecundariaGenerico = Pick<
  T_Profesores_Secundaria,
  | "Id_Profesor_Secundaria"
  | "Nombres"
  | "Apellidos"
  | "Genero"
  | "Google_Drive_Foto_ID"
>;

export type TutorGenerico = Pick<
  T_Profesores_Secundaria,
  "Id_Profesor_Secundaria" | "Nombres" | "Apellidos" | "Genero"
>;

export type PersonalAdministrativoGenerico = Pick<
  T_Personal_Administrativo,
  "Id_Personal_Administrativo" | "Nombres" | "Apellidos" | "Genero"
>;



export interface GenericUser {
  ID_Usuario: string;
  Rol: RolesSistema;
  Nombres: string;
  Apellidos: string;
  Genero?: Genero;
  Identificador_Nacional_Directivo?: string;
  Google_Drive_Foto_ID: string | null;
}
