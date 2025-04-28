-- CreateTable
CREATE TABLE "T_Archivos_Respaldo_Google_Drive" (
    "Id_Archivo_Respaldo" SERIAL NOT NULL,
    "Nombre_Archivo" VARCHAR(255) NOT NULL,
    "Google_Drive_Id" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Ultima_Modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "T_Archivos_Respaldo_Google_Drive_pkey" PRIMARY KEY ("Id_Archivo_Respaldo")
);
