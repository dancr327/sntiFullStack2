-- AlterEnum
ALTER TYPE "estatus_permiso" ADD VALUE 'NoSolicitado';

-- AddForeignKey
ALTER TABLE "hijos" ADD CONSTRAINT "hijos_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajadores"("id_trabajador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajadores"("id_trabajador") ON DELETE CASCADE ON UPDATE CASCADE;
