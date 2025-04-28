/*
  Warnings:

  - You are about to drop the column `Cant_Hora_Academicas` on the `T_Bloqueo_Roles` table. All the data in the column will be lost.
  - You are about to drop the column `Indice_Hora_Academica_Inicio` on the `T_Bloqueo_Roles` table. All the data in the column will be lost.
  - Added the required column `Bloqueo_Total` to the `T_Bloqueo_Roles` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `Rol` on the `T_Bloqueo_Roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('D', 'PP', 'A', 'PS', 'T', 'R', 'PA');

-- AlterTable
ALTER TABLE "T_Bloqueo_Roles" DROP COLUMN "Cant_Hora_Academicas",
DROP COLUMN "Indice_Hora_Academica_Inicio",
ADD COLUMN     "Bloqueo_Total" BOOLEAN NOT NULL,
DROP COLUMN "Rol",
ADD COLUMN     "Rol" "RolUsuario" NOT NULL,
ALTER COLUMN "Timestamp_Desbloqueo" SET DATA TYPE BIGINT;

-- CreateTable
CREATE TABLE "T_Ajustes_Generales_Sistema" (
    "Id_Constante" SERIAL NOT NULL,
    "Nombre" VARCHAR(100) NOT NULL,
    "Valor" VARCHAR(30) NOT NULL,
    "Descripcion" TEXT NOT NULL,
    "Ultima_Modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "T_Ajustes_Generales_Sistema_pkey" PRIMARY KEY ("Id_Constante")
);

-- CreateTable
CREATE TABLE "T_Horarios_Asistencia" (
    "Id_Horario" SERIAL NOT NULL,
    "Nombre" VARCHAR(100) NOT NULL,
    "Valor" TIME NOT NULL,
    "Descripcion" TEXT NOT NULL,
    "Ultima_Modificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "T_Horarios_Asistencia_pkey" PRIMARY KEY ("Id_Horario")
);

-- CreateTable
CREATE TABLE "T_Eventos" (
    "Id_Evento" SERIAL NOT NULL,
    "Nombre" VARCHAR(150) NOT NULL,
    "Fecha_Inicio" DATE NOT NULL,
    "Fecha_Conclusion" DATE NOT NULL,

    CONSTRAINT "T_Eventos_pkey" PRIMARY KEY ("Id_Evento")
);

-- CreateTable
CREATE TABLE "T_Registro_Fallos_Sistema" (
    "Id_Registro_Fallo_Sistema" SERIAL NOT NULL,
    "Fecha" DATE NOT NULL,
    "Componente" VARCHAR(50) NOT NULL,
    "Detalles" TEXT,

    CONSTRAINT "T_Registro_Fallos_Sistema_pkey" PRIMARY KEY ("Id_Registro_Fallo_Sistema")
);

-- CreateIndex
CREATE UNIQUE INDEX "T_Ajustes_Generales_Sistema_Nombre_key" ON "T_Ajustes_Generales_Sistema"("Nombre");

-- CreateIndex
CREATE UNIQUE INDEX "T_Horarios_Asistencia_Nombre_key" ON "T_Horarios_Asistencia"("Nombre");
