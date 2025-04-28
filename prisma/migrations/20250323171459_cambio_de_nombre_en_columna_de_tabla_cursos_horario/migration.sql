/*
  Warnings:

  - You are about to drop the column `Id_Aula` on the `T_Cursos_Horario` table. All the data in the column will be lost.
  - Added the required column `Id_Aula_Secundaria` to the `T_Cursos_Horario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "T_Cursos_Horario" DROP CONSTRAINT "T_Cursos_Horario_Id_Aula_fkey";

-- AlterTable
ALTER TABLE "T_Cursos_Horario" DROP COLUMN "Id_Aula",
ADD COLUMN     "Id_Aula_Secundaria" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "T_Cursos_Horario" ADD CONSTRAINT "T_Cursos_Horario_Id_Aula_Secundaria_fkey" FOREIGN KEY ("Id_Aula_Secundaria") REFERENCES "T_Aulas"("Id_Aula") ON DELETE RESTRICT ON UPDATE CASCADE;
