import { Router } from "express";
import directivoLoginRouter from "./directivo";
import profesorPrimariaLoginRouter from "./profesor-primaria";
import auxiliarLoginRouter from "./auxiliar";
import profesorTutorSecundariaLoginRouter from "./profesor-tutor-secundaria";
import personalAdministrativoLoginRouter from "./personal-administrativo";
const loginRouter = Router();

loginRouter.use("/directivo", directivoLoginRouter);
loginRouter.use("/profesor-primaria", profesorPrimariaLoginRouter);
loginRouter.use("/auxiliar", auxiliarLoginRouter);
loginRouter.use(
  "/profesor-tutor-secundaria",
  profesorTutorSecundariaLoginRouter
);
loginRouter.use("/personal-administrativo", personalAdministrativoLoginRouter);

export default loginRouter;
