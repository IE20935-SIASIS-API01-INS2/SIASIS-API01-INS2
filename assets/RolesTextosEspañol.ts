import { RolesSistema } from "../src/interfaces/shared/RolesSistema";

export const RolesTexto: Record<
  RolesSistema,
  { singular: string; plural: string }
> = {
  D: {
    singular: "Directivo",
    plural: "Directivos",
  },
  A: {
    singular: "Auxiliar",
    plural: "Auxiliares",
  },
  PA: {
    singular: "Personal Administrativo",
    plural: "Personal Administrativo",
  },
  PP: {
    singular: "Profesor de Primaria",
    plural: "Profesores de Primaria",
  },
  PS: {
    singular: "Profesor de Secundaria",
    plural: "Profesores de Secundaria",
  },
  R: {
    singular: "Responsable",
    plural: "Responsables",
  },
  T: {
    singular: "Tutor",
    plural: "Tutores",
  },
};
