-- CreateTable
CREATE TABLE "T_A_E_P_1" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_1_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_P_2" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_2_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_P_3" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_3_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_P_4" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_4_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_P_5" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_5_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_P_6" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_P_6_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_S_1" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_S_1_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_S_2" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_S_2_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_S_3" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_S_3_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_S_4" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_S_4_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_A_E_S_5" (
    "Id_Asistencia_Escolar_Mensual" SERIAL NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Estados" TEXT NOT NULL,

    CONSTRAINT "T_A_E_S_5_pkey" PRIMARY KEY ("Id_Asistencia_Escolar_Mensual")
);

-- CreateTable
CREATE TABLE "T_Comunicados" (
    "Id_Comunicado" SERIAL NOT NULL,
    "Titulo" VARCHAR(150) NOT NULL,
    "Contenido" TEXT NOT NULL,
    "Fecha_Inicio" DATE NOT NULL,
    "Fecha_Conclusion" DATE NOT NULL,
    "Google_Drive_Imagen_ID" TEXT,

    CONSTRAINT "T_Comunicados_pkey" PRIMARY KEY ("Id_Comunicado")
);

-- CreateIndex
CREATE INDEX "T_A_E_P_1_DNI_Estudiante_idx" ON "T_A_E_P_1"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_1_Mes_idx" ON "T_A_E_P_1"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_P_2_DNI_Estudiante_idx" ON "T_A_E_P_2"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_2_Mes_idx" ON "T_A_E_P_2"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_P_3_DNI_Estudiante_idx" ON "T_A_E_P_3"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_3_Mes_idx" ON "T_A_E_P_3"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_P_4_DNI_Estudiante_idx" ON "T_A_E_P_4"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_4_Mes_idx" ON "T_A_E_P_4"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_P_5_DNI_Estudiante_idx" ON "T_A_E_P_5"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_5_Mes_idx" ON "T_A_E_P_5"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_P_6_DNI_Estudiante_idx" ON "T_A_E_P_6"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_P_6_Mes_idx" ON "T_A_E_P_6"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_S_1_DNI_Estudiante_idx" ON "T_A_E_S_1"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_S_1_Mes_idx" ON "T_A_E_S_1"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_S_2_DNI_Estudiante_idx" ON "T_A_E_S_2"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_S_2_Mes_idx" ON "T_A_E_S_2"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_S_3_DNI_Estudiante_idx" ON "T_A_E_S_3"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_S_3_Mes_idx" ON "T_A_E_S_3"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_S_4_DNI_Estudiante_idx" ON "T_A_E_S_4"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_S_4_Mes_idx" ON "T_A_E_S_4"("Mes");

-- CreateIndex
CREATE INDEX "T_A_E_S_5_DNI_Estudiante_idx" ON "T_A_E_S_5"("DNI_Estudiante");

-- CreateIndex
CREATE INDEX "T_A_E_S_5_Mes_idx" ON "T_A_E_S_5"("Mes");

-- AddForeignKey
ALTER TABLE "T_A_E_P_1" ADD CONSTRAINT "T_A_E_P_1_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_2" ADD CONSTRAINT "T_A_E_P_2_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_3" ADD CONSTRAINT "T_A_E_P_3_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_4" ADD CONSTRAINT "T_A_E_P_4_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_5" ADD CONSTRAINT "T_A_E_P_5_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_P_6" ADD CONSTRAINT "T_A_E_P_6_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_S_1" ADD CONSTRAINT "T_A_E_S_1_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_S_2" ADD CONSTRAINT "T_A_E_S_2_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_S_3" ADD CONSTRAINT "T_A_E_S_3_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_S_4" ADD CONSTRAINT "T_A_E_S_4_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_A_E_S_5" ADD CONSTRAINT "T_A_E_S_5_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE CASCADE ON UPDATE CASCADE;
