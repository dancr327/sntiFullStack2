/*
  Warnings:

  - A unique constraint covering the columns `[nombre_seccion]` on the table `secciones` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "secciones_nombre_seccion_key" ON "secciones"("nombre_seccion");
