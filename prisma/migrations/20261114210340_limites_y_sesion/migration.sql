-- AlterTable
ALTER TABLE "Tienda" ADD COLUMN     "versionSesion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Limite" (
    "clave" TEXT NOT NULL,
    "cuenta" INTEGER NOT NULL DEFAULT 0,
    "desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bloqueadoHasta" TIMESTAMP(3),

    CONSTRAINT "Limite_pkey" PRIMARY KEY ("clave")
);
