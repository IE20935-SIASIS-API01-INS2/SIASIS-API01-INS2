/*
  Warnings:

  - The primary key for the `T_Ultima_Modificacion_Tablas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Id_Ultima_Modificacion` on the `T_Ultima_Modificacion_Tablas` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "T_Ultima_Modificacion_Tablas_Nombre_Tabla_idx";

-- AlterTable
ALTER TABLE "T_Ultima_Modificacion_Tablas" DROP CONSTRAINT "T_Ultima_Modificacion_Tablas_pkey",
DROP COLUMN "Id_Ultima_Modificacion",
ADD CONSTRAINT "T_Ultima_Modificacion_Tablas_pkey" PRIMARY KEY ("Nombre_Tabla");
