/*
  Warnings:

  - You are about to drop the column `Cantidad_Filas` on the `T_Ultima_Modificacion_Tablas` table. All the data in the column will be lost.
  - You are about to drop the column `Usuario_Modificacion` on the `T_Ultima_Modificacion_Tablas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "T_Ultima_Modificacion_Tablas" DROP COLUMN "Cantidad_Filas",
DROP COLUMN "Usuario_Modificacion";
