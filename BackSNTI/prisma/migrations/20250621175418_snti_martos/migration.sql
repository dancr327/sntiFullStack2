/*
  Warnings:

  - You are about to drop the column `constancia_documentos_comprobatorios` on the `cambiosadscripcion` table. All the data in the column will be lost.
  - You are about to drop the column `constancia_nombramiento_personal` on the `cambiosadscripcion` table. All the data in the column will be lost.
  - You are about to drop the column `documento_respaldo_id` on the `cambiosadscripcion` table. All the data in the column will be lost.
  - You are about to drop the column `constancia_reconocimiento_oficio` on the `cursos` table. All the data in the column will be lost.
  - You are about to drop the column `certificado_id` on the `trabajadores_cursos` table. All the data in the column will be lost.
  - You are about to drop the column `documento_conclusion` on the `trabajadores_cursos` table. All the data in the column will be lost.
  - You are about to drop the column `documento_invitacion` on the `trabajadores_cursos` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_documento_conclusion` on the `trabajadores_cursos` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_documento_invitacion` on the `trabajadores_cursos` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CusoStatus" AS ENUM ('EnCurso', 'Finalizado', 'Cancelado', 'Suspendido');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoDocumento" ADD VALUE 'INVITACION_CURSO';
ALTER TYPE "TipoDocumento" ADD VALUE 'CONCLUSION_CURSO';

-- DropForeignKey
ALTER TABLE "cambiosadscripcion" DROP CONSTRAINT "cambiosadscripcion_documento_respaldo_id_fkey";

-- DropForeignKey
ALTER TABLE "trabajadores_cursos" DROP CONSTRAINT "trabajadores_cursos_certificado_id_fkey";

-- AlterTable
ALTER TABLE "cambiosadscripcion" DROP COLUMN "constancia_documentos_comprobatorios",
DROP COLUMN "constancia_nombramiento_personal",
DROP COLUMN "documento_respaldo_id",
ADD COLUMN     "documento_comprobatorio_id" INTEGER,
ADD COLUMN     "documento_nombramiento_id" INTEGER;

-- AlterTable
ALTER TABLE "cursos" DROP COLUMN "constancia_reconocimiento_oficio",
ADD COLUMN     "documento_constancia_id" INTEGER;

-- AlterTable
ALTER TABLE "documentos" ALTER COLUMN "id_trabajador" DROP NOT NULL;

-- AlterTable
ALTER TABLE "trabajadores_cursos" DROP COLUMN "certificado_id",
DROP COLUMN "documento_conclusion",
DROP COLUMN "documento_invitacion",
DROP COLUMN "tipo_documento_conclusion",
DROP COLUMN "tipo_documento_invitacion",
ADD COLUMN     "documento_certificado_id" INTEGER,
ADD COLUMN     "documento_conclusion_id" INTEGER,
ADD COLUMN     "documento_invitacion_id" INTEGER;

-- AddForeignKey
ALTER TABLE "cambiosadscripcion" ADD CONSTRAINT "cambiosadscripcion_documento_comprobatorio_id_fkey" FOREIGN KEY ("documento_comprobatorio_id") REFERENCES "documentos"("id_documento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambiosadscripcion" ADD CONSTRAINT "cambiosadscripcion_documento_nombramiento_id_fkey" FOREIGN KEY ("documento_nombramiento_id") REFERENCES "documentos"("id_documento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_documento_constancia_id_fkey" FOREIGN KEY ("documento_constancia_id") REFERENCES "documentos"("id_documento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajadores_cursos" ADD CONSTRAINT "trabajadores_cursos_documento_certificado_id_fkey" FOREIGN KEY ("documento_certificado_id") REFERENCES "documentos"("id_documento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajadores_cursos" ADD CONSTRAINT "trabajadores_cursos_documento_invitacion_id_fkey" FOREIGN KEY ("documento_invitacion_id") REFERENCES "documentos"("id_documento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajadores_cursos" ADD CONSTRAINT "trabajadores_cursos_documento_conclusion_id_fkey" FOREIGN KEY ("documento_conclusion_id") REFERENCES "documentos"("id_documento") ON DELETE SET NULL ON UPDATE CASCADE;
