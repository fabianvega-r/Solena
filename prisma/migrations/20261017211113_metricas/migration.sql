-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('VISITA', 'WHATSAPP');

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "visitante" TEXT NOT NULL,
    "dia" DATE NOT NULL,
    "ruta" TEXT NOT NULL,
    "prendaId" TEXT,
    "coleccionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaccion" (
    "prendaId" TEXT NOT NULL,
    "visitante" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaccion_pkey" PRIMARY KEY ("prendaId","visitante")
);

-- CreateIndex
CREATE INDEX "Evento_dia_tipo_idx" ON "Evento"("dia", "tipo");

-- CreateIndex
CREATE INDEX "Evento_prendaId_idx" ON "Evento"("prendaId");

-- CreateIndex
CREATE UNIQUE INDEX "Evento_tipo_visitante_dia_ruta_key" ON "Evento"("tipo", "visitante", "dia", "ruta");

-- CreateIndex
CREATE INDEX "Reaccion_createdAt_idx" ON "Reaccion"("createdAt");

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_prendaId_fkey" FOREIGN KEY ("prendaId") REFERENCES "Prenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_coleccionId_fkey" FOREIGN KEY ("coleccionId") REFERENCES "Coleccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaccion" ADD CONSTRAINT "Reaccion_prendaId_fkey" FOREIGN KEY ("prendaId") REFERENCES "Prenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
