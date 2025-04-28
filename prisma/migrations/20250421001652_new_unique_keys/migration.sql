/*
  Warnings:

  - A unique constraint covering the columns `[Nombre_Archivo]` on the table `T_Archivos_Respaldo_Google_Drive` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "T_Archivos_Respaldo_Google_Drive_Nombre_Archivo_key" ON "T_Archivos_Respaldo_Google_Drive"("Nombre_Archivo");
