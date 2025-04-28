/*
  Warnings:

  - Changed the type of `Fecha_Creacion` on the `T_Codigos_OTP` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `Fecha_Expiracion` on the `T_Codigos_OTP` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `Id_Aula` to the `T_Cursos_Horario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "T_Codigos_OTP" DROP COLUMN "Fecha_Creacion",
ADD COLUMN     "Fecha_Creacion" BIGINT NOT NULL,
DROP COLUMN "Fecha_Expiracion",
ADD COLUMN     "Fecha_Expiracion" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "T_Cursos_Horario" ADD COLUMN     "Id_Aula" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "T_Cursos_Horario" ADD CONSTRAINT "T_Cursos_Horario_Id_Aula_fkey" FOREIGN KEY ("Id_Aula") REFERENCES "T_Aulas"("Id_Aula") ON DELETE RESTRICT ON UPDATE CASCADE;
