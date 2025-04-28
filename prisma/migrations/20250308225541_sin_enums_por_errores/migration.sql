/*
  Warnings:

  - Changed the type of `Nivel` on the `T_Aulas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `Genero` on the `T_Auxiliares` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `Rol` on the `T_Bloqueo_Roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `Genero` on the `T_Directivos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `Genero` on the `T_Personal_Administrativo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `Genero` on the `T_Profesores_Primaria` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `Genero` on the `T_Profesores_Secundaria` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `Tipo` on the `T_Relaciones_E_R` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "T_Aulas" DROP COLUMN "Nivel",
ADD COLUMN     "Nivel" VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE "T_Auxiliares" DROP COLUMN "Genero",
ADD COLUMN     "Genero" VARCHAR(1) NOT NULL;

-- AlterTable
ALTER TABLE "T_Bloqueo_Roles" DROP COLUMN "Rol",
ADD COLUMN     "Rol" VARCHAR(2) NOT NULL;

-- AlterTable
ALTER TABLE "T_Directivos" DROP COLUMN "Genero",
ADD COLUMN     "Genero" VARCHAR(1) NOT NULL;

-- AlterTable
ALTER TABLE "T_Personal_Administrativo" DROP COLUMN "Genero",
ADD COLUMN     "Genero" VARCHAR(1) NOT NULL;

-- AlterTable
ALTER TABLE "T_Profesores_Primaria" DROP COLUMN "Genero",
ADD COLUMN     "Genero" VARCHAR(1) NOT NULL;

-- AlterTable
ALTER TABLE "T_Profesores_Secundaria" DROP COLUMN "Genero",
ADD COLUMN     "Genero" VARCHAR(1) NOT NULL;

-- AlterTable
ALTER TABLE "T_Relaciones_E_R" DROP COLUMN "Tipo",
ADD COLUMN     "Tipo" VARCHAR(1) NOT NULL;

-- DropEnum
DROP TYPE "Genero";

-- DropEnum
DROP TYPE "NivelEducativo";

-- DropEnum
DROP TYPE "RolUsuario";

-- DropEnum
DROP TYPE "TipoRelacion";
