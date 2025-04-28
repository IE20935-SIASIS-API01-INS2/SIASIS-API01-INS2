-- CreateTable
CREATE TABLE "T_Vacaciones_Interescolares" (
    "Id_Vacacion_Interescolar" SERIAL NOT NULL,
    "Fecha_Inicio" DATE NOT NULL,
    "Fecha_Conclusion" DATE NOT NULL,

    CONSTRAINT "T_Vacaciones_Interescolares_pkey" PRIMARY KEY ("Id_Vacacion_Interescolar")
);
