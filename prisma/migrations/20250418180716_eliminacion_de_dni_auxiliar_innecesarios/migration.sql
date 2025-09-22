/*
  Warnings:

  - You are about to drop the column `Id_Auxiliar` on the `T_Control_Entrada_Mensual_Profesores_Primaria` table. All the data in the column will be lost.
  - You are about to drop the column `Id_Auxiliar` on the `T_Control_Entrada_Mensual_Profesores_Secundaria` table. All the data in the column will be lost.
  - You are about to drop the column `Id_Auxiliar` on the `T_Control_Salida_Mensual_Profesores_Primaria` table. All the data in the column will be lost.
  - You are about to drop the column `Id_Auxiliar` on the `T_Control_Salida_Mensual_Profesores_Secundaria` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "T_Control_Entrada_Mensual_Profesores_Primaria" DROP COLUMN "Id_Auxiliar";

-- AlterTable
ALTER TABLE "T_Control_Entrada_Mensual_Profesores_Secundaria" DROP COLUMN "Id_Auxiliar";

-- AlterTable
ALTER TABLE "T_Control_Salida_Mensual_Profesores_Primaria" DROP COLUMN "Id_Auxiliar";

-- AlterTable
ALTER TABLE "T_Control_Salida_Mensual_Profesores_Secundaria" DROP COLUMN "Id_Auxiliar";
