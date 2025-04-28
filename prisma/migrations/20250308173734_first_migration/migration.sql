-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('M', 'S');

-- CreateEnum
CREATE TYPE "TipoRelacion" AS ENUM ('P', 'A');

-- CreateEnum
CREATE TYPE "NivelEducativo" AS ENUM ('Primaria', 'Secundaria');

-- CreateTable
CREATE TABLE "T_Directivos" (
    "Id_Directivo" SERIAL NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Genero" "Genero" NOT NULL,
    "DNI" VARCHAR(8) NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Correo_Electronico" VARCHAR(70) NOT NULL,
    "Celular" VARCHAR(9) NOT NULL,
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,

    CONSTRAINT "T_Directivos_pkey" PRIMARY KEY ("Id_Directivo")
);

-- CreateTable
CREATE TABLE "T_Estudiantes" (
    "DNI_Estudiante" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Estado" BOOLEAN NOT NULL,
    "Google_Drive_Foto_ID" TEXT,
    "Id_Aula" INTEGER,

    CONSTRAINT "T_Estudiantes_pkey" PRIMARY KEY ("DNI_Estudiante")
);

-- CreateTable
CREATE TABLE "T_Responsables" (
    "DNI_Responsable" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Celular" VARCHAR(9),
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,

    CONSTRAINT "T_Responsables_pkey" PRIMARY KEY ("DNI_Responsable")
);

-- CreateTable
CREATE TABLE "T_Relaciones_E_R" (
    "Id_Relacion" SERIAL NOT NULL,
    "Tipo" "TipoRelacion" NOT NULL,
    "DNI_Responsable" VARCHAR(8) NOT NULL,
    "DNI_Estudiante" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Relaciones_E_R_pkey" PRIMARY KEY ("Id_Relacion")
);

-- CreateTable
CREATE TABLE "T_Profesores_Primaria" (
    "DNI_Profesor_Primaria" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Genero" "Genero" NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Estado" BOOLEAN NOT NULL,
    "Correo_Electronico" VARCHAR(70),
    "Celular" VARCHAR(9) NOT NULL,
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,

    CONSTRAINT "T_Profesores_Primaria_pkey" PRIMARY KEY ("DNI_Profesor_Primaria")
);

-- CreateTable
CREATE TABLE "T_Profesores_Secundaria" (
    "DNI_Profesor_Secundaria" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Genero" "Genero" NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Estado" BOOLEAN NOT NULL,
    "Correo_Electronico" VARCHAR(70),
    "Celular" VARCHAR(9) NOT NULL,
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,

    CONSTRAINT "T_Profesores_Secundaria_pkey" PRIMARY KEY ("DNI_Profesor_Secundaria")
);

-- CreateTable
CREATE TABLE "T_Aulas" (
    "Id_Aula" SERIAL NOT NULL,
    "Nivel" "NivelEducativo" NOT NULL,
    "Grado" INTEGER NOT NULL,
    "Seccion" VARCHAR(2) NOT NULL,
    "Color" VARCHAR(15) NOT NULL,
    "DNI_Profesor_Primaria" VARCHAR(8),
    "DNI_Profesor_Secundaria" VARCHAR(8),

    CONSTRAINT "T_Aulas_pkey" PRIMARY KEY ("Id_Aula")
);

-- CreateTable
CREATE TABLE "T_Cursos_Horario" (
    "Id_Curso_Horario" SERIAL NOT NULL,
    "Nombre_Curso" VARCHAR(75) NOT NULL,
    "Dia_Semana" INTEGER NOT NULL,
    "Indice_Hora_Academica_Inicio" INTEGER NOT NULL,
    "Cant_Hora_Academicas" INTEGER NOT NULL,
    "DNI_Profesor_Secundaria" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Cursos_Horario_pkey" PRIMARY KEY ("Id_Curso_Horario")
);

-- CreateTable
CREATE TABLE "T_Control_Entrada_Mensual_Profesores_Primaria" (
    "Id_C_E_M_P_Profesores_Primaria" SERIAL NOT NULL,
    "Mes" INTEGER NOT NULL,
    "Entradas" JSONB NOT NULL,
    "DNI_Auxiliar" VARCHAR(8) NOT NULL,
    "DNI_Profesor_Primaria" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Entrada_Mensual_Profesores_Primaria_pkey" PRIMARY KEY ("Id_C_E_M_P_Profesores_Primaria")
);

-- CreateTable
CREATE TABLE "T_Control_Salida_Mensual_Profesores_Primaria" (
    "Id_C_E_M_P_Profesores_Primaria" SERIAL NOT NULL,
    "Mes" INTEGER NOT NULL,
    "Salidas" JSONB NOT NULL,
    "DNI_Auxiliar" VARCHAR(8) NOT NULL,
    "DNI_Profesor_Primaria" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Salida_Mensual_Profesores_Primaria_pkey" PRIMARY KEY ("Id_C_E_M_P_Profesores_Primaria")
);

-- CreateTable
CREATE TABLE "T_Control_Entrada_Mensual_Profesores_Secundaria" (
    "Id_C_E_M_P_Profesores_Secundaria" SERIAL NOT NULL,
    "Mes" INTEGER NOT NULL,
    "Entradas" JSONB NOT NULL,
    "DNI_Auxiliar" VARCHAR(8) NOT NULL,
    "DNI_Profesor_Secundaria" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Entrada_Mensual_Profesores_Secundaria_pkey" PRIMARY KEY ("Id_C_E_M_P_Profesores_Secundaria")
);

-- CreateTable
CREATE TABLE "T_Control_Salida_Mensual_Profesores_Secundaria" (
    "Id_C_E_M_P_Profesores_Secundaria" SERIAL NOT NULL,
    "Mes" INTEGER NOT NULL,
    "Salidas" JSONB NOT NULL,
    "DNI_Auxiliar" VARCHAR(8) NOT NULL,
    "DNI_Profesor_Secundaria" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Salida_Mensual_Profesores_Secundaria_pkey" PRIMARY KEY ("Id_C_E_M_P_Profesores_Secundaria")
);

-- CreateTable
CREATE TABLE "T_Auxiliares" (
    "DNI_Auxiliar" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Genero" "Genero" NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Estado" BOOLEAN NOT NULL,
    "Correo_Electronico" VARCHAR(70),
    "Celular" VARCHAR(9) NOT NULL,
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,

    CONSTRAINT "T_Auxiliares_pkey" PRIMARY KEY ("DNI_Auxiliar")
);

-- CreateTable
CREATE TABLE "T_Control_Entrada_Mensual_Auxiliar" (
    "Id_C_E_M_P_Auxiliar" SERIAL NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Entradas" JSONB NOT NULL,
    "DNI_Auxiliar" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Entrada_Mensual_Auxiliar_pkey" PRIMARY KEY ("Id_C_E_M_P_Auxiliar")
);

-- CreateTable
CREATE TABLE "T_Control_Salida_Mensual_Auxiliar" (
    "Id_C_E_M_P_Auxiliar" SERIAL NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Salidas" JSONB NOT NULL,
    "DNI_Auxiliar" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Salida_Mensual_Auxiliar_pkey" PRIMARY KEY ("Id_C_E_M_P_Auxiliar")
);

-- CreateTable
CREATE TABLE "T_Personal_Administrativo" (
    "DNI_Personal_Administrativo" VARCHAR(8) NOT NULL,
    "Nombres" VARCHAR(60) NOT NULL,
    "Apellidos" VARCHAR(60) NOT NULL,
    "Genero" "Genero" NOT NULL,
    "Nombre_Usuario" VARCHAR(40) NOT NULL,
    "Estado" BOOLEAN NOT NULL,
    "Celular" VARCHAR(9) NOT NULL,
    "Contraseña" TEXT NOT NULL,
    "Google_Drive_Foto_ID" TEXT,
    "Horario_Laboral_Entrada" TIME NOT NULL,
    "Horario_Laboral_Salida" TIME NOT NULL,

    CONSTRAINT "T_Personal_Administrativo_pkey" PRIMARY KEY ("DNI_Personal_Administrativo")
);

-- CreateTable
CREATE TABLE "T_Control_Entrada_Mensual_Personal_Administrativo" (
    "Id_C_E_M_P_Administrativo" SERIAL NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Entradas" JSONB NOT NULL,
    "DNI_Personal_Administrativo" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Entrada_Mensual_Personal_Administrativo_pkey" PRIMARY KEY ("Id_C_E_M_P_Administrativo")
);

-- CreateTable
CREATE TABLE "T_Control_Salida_Mensual_Personal_Administrativo" (
    "Id_C_E_M_P_Administrativo" SERIAL NOT NULL,
    "Mes" SMALLINT NOT NULL,
    "Salidas" JSONB NOT NULL,
    "DNI_Personal_Administrativo" VARCHAR(8) NOT NULL,

    CONSTRAINT "T_Control_Salida_Mensual_Personal_Administrativo_pkey" PRIMARY KEY ("Id_C_E_M_P_Administrativo")
);

-- CreateTable
CREATE TABLE "T_Bloqueo_Roles" (
    "Id_Bloqueo_Rol" SERIAL NOT NULL,
    "Rol" VARCHAR(75) NOT NULL,
    "Timestamp_Desbloqueo" SMALLINT NOT NULL,
    "Indice_Hora_Academica_Inicio" SMALLINT NOT NULL,
    "Cant_Hora_Academicas" SMALLINT NOT NULL,

    CONSTRAINT "T_Bloqueo_Roles_pkey" PRIMARY KEY ("Id_Bloqueo_Rol")
);

-- CreateIndex
CREATE UNIQUE INDEX "T_Directivos_Nombre_Usuario_key" ON "T_Directivos"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Responsables_Nombre_Usuario_key" ON "T_Responsables"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Profesores_Primaria_Nombre_Usuario_key" ON "T_Profesores_Primaria"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Profesores_Secundaria_Nombre_Usuario_key" ON "T_Profesores_Secundaria"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Auxiliares_Nombre_Usuario_key" ON "T_Auxiliares"("Nombre_Usuario");

-- CreateIndex
CREATE UNIQUE INDEX "T_Personal_Administrativo_Nombre_Usuario_key" ON "T_Personal_Administrativo"("Nombre_Usuario");

-- AddForeignKey
ALTER TABLE "T_Estudiantes" ADD CONSTRAINT "T_Estudiantes_Id_Aula_fkey" FOREIGN KEY ("Id_Aula") REFERENCES "T_Aulas"("Id_Aula") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Relaciones_E_R" ADD CONSTRAINT "T_Relaciones_E_R_DNI_Responsable_fkey" FOREIGN KEY ("DNI_Responsable") REFERENCES "T_Responsables"("DNI_Responsable") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Relaciones_E_R" ADD CONSTRAINT "T_Relaciones_E_R_DNI_Estudiante_fkey" FOREIGN KEY ("DNI_Estudiante") REFERENCES "T_Estudiantes"("DNI_Estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Aulas" ADD CONSTRAINT "T_Aulas_DNI_Profesor_Primaria_fkey" FOREIGN KEY ("DNI_Profesor_Primaria") REFERENCES "T_Profesores_Primaria"("DNI_Profesor_Primaria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Aulas" ADD CONSTRAINT "T_Aulas_DNI_Profesor_Secundaria_fkey" FOREIGN KEY ("DNI_Profesor_Secundaria") REFERENCES "T_Profesores_Secundaria"("DNI_Profesor_Secundaria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Cursos_Horario" ADD CONSTRAINT "T_Cursos_Horario_DNI_Profesor_Secundaria_fkey" FOREIGN KEY ("DNI_Profesor_Secundaria") REFERENCES "T_Profesores_Secundaria"("DNI_Profesor_Secundaria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Entrada_Mensual_Profesores_Primaria" ADD CONSTRAINT "T_Control_Entrada_Mensual_Profesores_Primaria_DNI_Profesor_fkey" FOREIGN KEY ("DNI_Profesor_Primaria") REFERENCES "T_Profesores_Primaria"("DNI_Profesor_Primaria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Salida_Mensual_Profesores_Primaria" ADD CONSTRAINT "T_Control_Salida_Mensual_Profesores_Primaria_DNI_Profesor__fkey" FOREIGN KEY ("DNI_Profesor_Primaria") REFERENCES "T_Profesores_Primaria"("DNI_Profesor_Primaria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Entrada_Mensual_Profesores_Secundaria" ADD CONSTRAINT "T_Control_Entrada_Mensual_Profesores_Secundaria_DNI_Profes_fkey" FOREIGN KEY ("DNI_Profesor_Secundaria") REFERENCES "T_Profesores_Secundaria"("DNI_Profesor_Secundaria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Salida_Mensual_Profesores_Secundaria" ADD CONSTRAINT "T_Control_Salida_Mensual_Profesores_Secundaria_DNI_Profeso_fkey" FOREIGN KEY ("DNI_Profesor_Secundaria") REFERENCES "T_Profesores_Secundaria"("DNI_Profesor_Secundaria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Entrada_Mensual_Auxiliar" ADD CONSTRAINT "T_Control_Entrada_Mensual_Auxiliar_DNI_Auxiliar_fkey" FOREIGN KEY ("DNI_Auxiliar") REFERENCES "T_Auxiliares"("DNI_Auxiliar") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Salida_Mensual_Auxiliar" ADD CONSTRAINT "T_Control_Salida_Mensual_Auxiliar_DNI_Auxiliar_fkey" FOREIGN KEY ("DNI_Auxiliar") REFERENCES "T_Auxiliares"("DNI_Auxiliar") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Entrada_Mensual_Personal_Administrativo" ADD CONSTRAINT "T_Control_Entrada_Mensual_Personal_Administrativo_DNI_Pers_fkey" FOREIGN KEY ("DNI_Personal_Administrativo") REFERENCES "T_Personal_Administrativo"("DNI_Personal_Administrativo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "T_Control_Salida_Mensual_Personal_Administrativo" ADD CONSTRAINT "T_Control_Salida_Mensual_Personal_Administrativo_DNI_Perso_fkey" FOREIGN KEY ("DNI_Personal_Administrativo") REFERENCES "T_Personal_Administrativo"("DNI_Personal_Administrativo") ON DELETE RESTRICT ON UPDATE CASCADE;
