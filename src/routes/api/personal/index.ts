import { Router } from "express";
import MisAsistenciasMensualesRouter from "./mis-asistencias";
import AsistenciasMensualesDePersonalRouter from "./asistencias-mensuales";
import isProfesorPrimariaAuthenticated from "../../../middlewares/isProfesorPrimariaAuthenticated";
import isAuxiliarAuthenticated from "../../../middlewares/isAuxiliarAuthenticated";
import isProfesorSecundariaAuthenticated from "../../../middlewares/isProfesorSecundariaAuthenticated";
import isTutorAuthenticated from "../../../middlewares/isTutorAuthenticated";
import isPersonalAdministrativoAuthenticated from "../../../middlewares/isPersonalAdministrativoAuthenticated";
import checkAuthentication from "../../../middlewares/checkAuthentication";
import isDirectivoAuthenticated from "../../../middlewares/isDirectivoAuthenticated";

const PersonalRouter = Router();

PersonalRouter.use(
  "/asistencias-mensuales",
  isDirectivoAuthenticated,
  checkAuthentication as any,
  AsistenciasMensualesDePersonalRouter
);
PersonalRouter.use(
  "/mis-asistencias",
  isProfesorPrimariaAuthenticated,
  isAuxiliarAuthenticated,
  isProfesorSecundariaAuthenticated,
  isTutorAuthenticated,
  isPersonalAdministrativoAuthenticated,
  checkAuthentication as any,
  MisAsistenciasMensualesRouter
);

export default PersonalRouter;
