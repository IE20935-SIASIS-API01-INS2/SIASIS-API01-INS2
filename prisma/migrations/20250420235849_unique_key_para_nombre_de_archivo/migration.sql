/*
  Warnings:

  - A unique constraint covering the columns `[Google_Drive_Id]` on the table `T_Archivos_Respaldo_Google_Drive` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "T_Archivos_Respaldo_Google_Drive_Google_Drive_Id_key" ON "T_Archivos_Respaldo_Google_Drive"("Google_Drive_Id");
