/*
  Warnings:

  - You are about to drop the column `descripcion` on the `secciones` table. All the data in the column will be lost.
  - You are about to drop the column `nombre_seccion` on the `secciones` table. All the data in the column will be lost.
  - You are about to drop the column `contraseña_hash` on the `trabajadores` table. All the data in the column will be lost.
  - The `rol` column on the `trabajadores` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[numero_seccion]` on the table `secciones` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `estado` to the `secciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero_seccion` to the `secciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ubicacion` to the `secciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `trabajadores` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('ACTA_NACIMIENTO', 'APROBACION_PERMISO', 'CERTIFICADO_CURSO', 'CERTIFICADO_ESTUDIO', 'CONSTANCIA_DOCUMENTOS_COMPROBATORIOS', 'CONSTANCIA_NOMBRAMIENTO', 'CONSTANCIA_RECONOCIMIENTO', 'CURP', 'INE', 'OFICIO', 'RFC', 'OTRO_DOCUMENTO');

-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('ADMINISTRADOR', 'USUARIO');

-- CreateEnum
CREATE TYPE "EstadosMexico" AS ENUM ('AGUASCALIENTES', 'BAJA_CALIFORNIA', 'BAJA_CALIFORNIA_SUR', 'CAMPECHE', 'CHIAPAS', 'CHIHUAHUA', 'CIUDAD_DE_MEXICO', 'COAHUILA', 'COLIMA', 'DURANGO', 'ESTADO_DE_MEXICO', 'GUANAJUATO', 'GUERRERO', 'HIDALGO', 'JALISCO', 'MICHOACAN', 'MORELOS', 'NAYARIT', 'NUEVO_LEON', 'OAXACA', 'PUEBLA', 'QUERETARO', 'QUINTANA_ROO', 'SAN_LUIS_POTOSI', 'SINALOA', 'SONORA', 'TABASCO', 'TAMAULIPAS', 'TLAXCALA', 'VERACRUZ', 'YUCATAN', 'ZACATECAS');

-- DropIndex
DROP INDEX "secciones_nombre_seccion_key";

-- AlterTable
ALTER TABLE "cambiosadscripcion" ADD COLUMN     "constancia_documentos_comprobatorios" TEXT,
ADD COLUMN     "constancia_nombramiento_personal" TEXT,
ADD COLUMN     "tipo_documento_comprobatorios" "TipoDocumento",
ADD COLUMN     "tipo_documento_nombramiento" "TipoDocumento";

-- AlterTable
ALTER TABLE "cursos" ADD COLUMN     "constancia_reconocimiento_oficio" TEXT,
ADD COLUMN     "tipo_documento_curso" "TipoDocumento";

-- AlterTable
ALTER TABLE "secciones" DROP COLUMN "descripcion",
DROP COLUMN "nombre_seccion",
ADD COLUMN     "estado" "EstadosMexico" NOT NULL,
ADD COLUMN     "numero_seccion" INTEGER NOT NULL,
ADD COLUMN     "secretario" VARCHAR(255),
ADD COLUMN     "ubicacion" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "trabajadores" DROP COLUMN "contraseña_hash",
ADD COLUMN     "password_hash" VARCHAR(255) NOT NULL,
DROP COLUMN "rol",
ADD COLUMN     "rol" "Roles" NOT NULL DEFAULT 'USUARIO';

-- AlterTable
ALTER TABLE "trabajadores_cursos" ADD COLUMN     "documento_conclusion" TEXT,
ADD COLUMN     "documento_invitacion" TEXT,
ADD COLUMN     "tipo_documento_conclusion" "TipoDocumento",
ADD COLUMN     "tipo_documento_invitacion" "TipoDocumento";

-- DropEnum
DROP TYPE "rol_usuario";

-- CreateTable
CREATE TABLE "galeria" (
    "id_imagen" SERIAL NOT NULL,
    "nombre_imagen" VARCHAR(255) NOT NULL,
    "ruta_imagen" TEXT NOT NULL,
    "tipo_imagen" VARCHAR(50) NOT NULL,
    "tamano_bytes" BIGINT NOT NULL,
    "es_activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "galeria_pkey" PRIMARY KEY ("id_imagen")
);

-- CreateTable
CREATE TABLE "contactos" (
    "id_contacto" SERIAL NOT NULL,
    "ocupacion" VARCHAR(100) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "correo" TEXT NOT NULL,

    CONSTRAINT "contactos_pkey" PRIMARY KEY ("id_contacto")
);

-- CreateIndex
CREATE INDEX "idx_galeria_activa" ON "galeria"("es_activa");

-- CreateIndex
CREATE UNIQUE INDEX "secciones_numero_seccion_key" ON "secciones"("numero_seccion");

-- AddForeignKey
ALTER TABLE "cambiosadscripcion" ADD CONSTRAINT "cambiosadscripcion_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajadores"("id_trabajador") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajadores"("id_trabajador") ON DELETE CASCADE ON UPDATE CASCADE;
