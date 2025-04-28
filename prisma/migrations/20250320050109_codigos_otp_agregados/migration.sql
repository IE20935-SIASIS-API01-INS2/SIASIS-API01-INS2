-- CreateTable
CREATE TABLE "T_Codigos_OTP" (
    "Id_Codigo_OTP" SERIAL NOT NULL,
    "Codigo" VARCHAR(6) NOT NULL,
    "Fecha_Creacion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "T_Codigos_OTP_pkey" PRIMARY KEY ("Id_Codigo_OTP")
);
