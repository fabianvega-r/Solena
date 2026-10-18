-- AlterTable
ALTER TABLE "Coleccion" ADD COLUMN     "portadaId" TEXT;

-- AddForeignKey
ALTER TABLE "Coleccion" ADD CONSTRAINT "Coleccion_portadaId_fkey" FOREIGN KEY ("portadaId") REFERENCES "Foto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
