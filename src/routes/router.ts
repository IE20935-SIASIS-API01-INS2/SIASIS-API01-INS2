// routes/index.ts
import { Router } from "express";

import { UserAuthenticatedAPI01 } from "../interfaces/shared/JWTPayload";
import AllErrorTypes from "../interfaces/shared/errors";
import { ErrorDetails } from "../interfaces/shared/errors/details";
import isDirectivoAuthenticated from "../middlewares/isDirectivoAuthenticated";
import checkAuthentication from "../middlewares/checkAuthentication";

import loginRouter from "./api/login";
import misDatosRouter from "./api/mis-datos";
import auxiliaresRouter from "./api/auxiliares";
import personalAdministrativoRouter from "./api/personal-administrativo";
import modificacionesTablasRouter from "./api/modificaciones-tablas";
// import asistenciaRouter from "./api/asistencia-diaria";

import isAuxiliarAuthenticated from "../middlewares/isAuxiliarAuthenticated";
import isProfesorPrimariaAuthenticated from "../middlewares/isProfesorPrimariaAuthenticated";
import isProfesorSecundariaAuthenticated from "../middlewares/isProfesorSecundariaAuthenticated";
import isTutorAuthenticated from "../middlewares/isTutorAuthenticated";
import isPersonalAdministrativoAuthenticated from "../middlewares/isPersonalAdministrativoAuthenticated";
import decodedRol from "../middlewares/decodedRol";
import { RolesSistema } from "../interfaces/shared/RolesSistema";
import { RDP02 } from "../interfaces/shared/RDP02Instancias";
import { RDP03 } from "../interfaces/shared/RDP03Instancias";
import PersonalRouter from "./api/personal/index";
import UsuarioGenericoRouter from "./api/usuarios-genericos";
import EventosRouter from "./api/eventos";

const router = Router();

// Extender la interfaz Request de Express
declare global {
  namespace Express {
    interface Request {
      RDP02_INSTANCE?: RDP02;
      RDP03_INSTANCE?: RDP03;
      user?: UserAuthenticatedAPI01;
      isAuthenticated?: boolean;
      userRole?: RolesSistema;
      authError?: {
        type: AllErrorTypes;
        message: string;
        details?: ErrorDetails;
      };
    }
  }
}

router.use("/login", loginRouter);

router.use(
  "/mis-datos",
  decodedRol as any,
  isDirectivoAuthenticated,
  isProfesorPrimariaAuthenticated,
  isProfesorSecundariaAuthenticated,
  isTutorAuthenticated,
  isAuxiliarAuthenticated,
  isPersonalAdministrativoAuthenticated as any,
  // isResponsableAuthenticated,
  checkAuthentication as any,
  misDatosRouter
);

router.use(
  "/auxiliares",
  decodedRol as any,
  isDirectivoAuthenticated as any,
  checkAuthentication as any,
  auxiliaresRouter
);

router.use(
  "/personal-administrativo",
  isDirectivoAuthenticated as any,
  checkAuthentication as any,
  personalAdministrativoRouter
);

router.use(
  "/modificaciones-tablas",
  decodedRol as any,
  isDirectivoAuthenticated,
  isProfesorPrimariaAuthenticated,
  isProfesorSecundariaAuthenticated,
  isTutorAuthenticated,
  isAuxiliarAuthenticated,
  isPersonalAdministrativoAuthenticated as any,
  // isResponsableAuthenticated,
  checkAuthentication as any,
  modificacionesTablasRouter
);

router.use("/personal", decodedRol as any, PersonalRouter);

router.use("/usuarios-genericos", decodedRol as any, UsuarioGenericoRouter);

router.use("/eventos", decodedRol as any, EventosRouter);

export default router;
