-- CreateTable
CREATE TABLE "T_Ultima_Modificacion_Tablas" (
    "Id_Ultima_Modificacion" SERIAL NOT NULL,
    "Nombre_Tabla" VARCHAR(100) NOT NULL,
    "Operacion" VARCHAR(20) NOT NULL,
    "Fecha_Modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Usuario_Modificacion" VARCHAR(100),
    "Cantidad_Filas" INTEGER,

    CONSTRAINT "T_Ultima_Modificacion_Tablas_pkey" PRIMARY KEY ("Id_Ultima_Modificacion")
);

-- CreateIndex
CREATE INDEX "T_Ultima_Modificacion_Tablas_Nombre_Tabla_idx" ON "T_Ultima_Modificacion_Tablas"("Nombre_Tabla");
