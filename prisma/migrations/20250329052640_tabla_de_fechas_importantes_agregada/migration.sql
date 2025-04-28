-- CreateTable
CREATE TABLE "T_Fechas_Importantes" (
    "Id_Fecha_Importante" SERIAL NOT NULL,
    "Nombre" VARCHAR(100) NOT NULL,
    "Valor" DATE NOT NULL,
    "Descripcion" TEXT,
    "Ultima_Modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "T_Fechas_Importantes_pkey" PRIMARY KEY ("Id_Fecha_Importante")
);
