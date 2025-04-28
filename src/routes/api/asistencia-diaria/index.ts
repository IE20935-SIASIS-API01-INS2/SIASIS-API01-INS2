import express from "express";
import marcarAsistenciaRouter from "./marcar";
import isProfesorPrimariaAuthenticated from "../../../middlewares/isProfesorPrimariaAuthenticated";
import isAuxiliarAuthenticated from "../../../middlewares/isAuxiliarAuthenticated";
import isDirectivoAuthenticated from "../../../middlewares/isDirectivoAuthenticated";
import checkAuthentication from "../../../middlewares/checkAuthentication";


const router = express();

router.use(

  isProfesorPrimariaAuthenticated,
  isAuxiliarAuthenticated,
  isDirectivoAuthenticated,
  checkAuthentication as any,
  marcarAsistenciaRouter
);

export default router;
