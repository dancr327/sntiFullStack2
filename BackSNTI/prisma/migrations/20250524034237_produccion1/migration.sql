/*
  Warnings:

  - The `situacion_sentimental` column on the `trabajadores` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `sexo` on the `trabajadores` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SituacionSentimental" AS ENUM ('Soltero', 'Casado', 'Divorciado', 'Viudo', 'UnionLibre');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('M', 'F');

-- AlterTable
ALTER TABLE "trabajadores" DROP COLUMN "sexo",
ADD COLUMN     "sexo" "Sexo" NOT NULL,
DROP COLUMN "situacion_sentimental",
ADD COLUMN     "situacion_sentimental" "SituacionSentimental";
