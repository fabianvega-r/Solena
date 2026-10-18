-- CreateTable
CREATE TABLE "Tienda" (
    "id" TEXT NOT NULL DEFAULT 'solena',
    "titulo" TEXT,
    "historia" TEXT,
    "fotoId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tienda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tienda_fotoId_key" ON "Tienda"("fotoId");

-- AddForeignKey
ALTER TABLE "Tienda" ADD CONSTRAINT "Tienda_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "Foto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
