/*
  Warnings:

  - Added the required column `Correo_Destino` to the `T_Codigos_OTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Fecha_Expiracion` to the `T_Codigos_OTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Id_Usuario` to the `T_Codigos_OTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Rol_Usuario` to the `T_Codigos_OTP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "T_Codigos_OTP" ADD COLUMN     "Correo_Destino" VARCHAR(70) NOT NULL,
ADD COLUMN     "Fecha_Expiracion" DATE NOT NULL,
ADD COLUMN     "Id_Usuario" VARCHAR(20) NOT NULL,
ADD COLUMN     "Rol_Usuario" VARCHAR(2) NOT NULL;
