/*
  Warnings:

  - Added the required column `Cargo` to the `T_Personal_Administrativo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "T_Personal_Administrativo" ADD COLUMN     "Cargo" VARCHAR(75) NOT NULL;
