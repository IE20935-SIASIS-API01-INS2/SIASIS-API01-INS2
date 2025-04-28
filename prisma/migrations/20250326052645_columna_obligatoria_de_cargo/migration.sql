/*
  Warnings:

  - Made the column `Cargo` on table `T_Personal_Administrativo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "T_Personal_Administrativo" ALTER COLUMN "Cargo" SET NOT NULL;
