-- CreateTable
CREATE TABLE "Coleccion" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "temporada" TEXT,
    "descripcion" TEXT,
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "fechaLanzamiento" TIMESTAMP(3),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coleccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prenda" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" INTEGER,
    "tallas" TEXT[],
    "colores" TEXT[],
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "coleccionId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "ancho" INTEGER NOT NULL,
    "alto" INTEGER NOT NULL,
    "blurDataUrl" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "prendaId" TEXT,
    "coleccionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coleccion_slug_key" ON "Coleccion"("slug");

-- CreateIndex
CREATE INDEX "Coleccion_publicada_fechaLanzamiento_idx" ON "Coleccion"("publicada", "fechaLanzamiento");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_slug_key" ON "Categoria"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Prenda_slug_key" ON "Prenda"("slug");

-- CreateIndex
CREATE INDEX "Prenda_coleccionId_orden_idx" ON "Prenda"("coleccionId", "orden");

-- CreateIndex
CREATE INDEX "Prenda_categoriaId_idx" ON "Prenda"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "Foto_clave_key" ON "Foto"("clave");

-- CreateIndex
CREATE INDEX "Foto_prendaId_orden_idx" ON "Foto"("prendaId", "orden");

-- CreateIndex
CREATE INDEX "Foto_coleccionId_orden_idx" ON "Foto"("coleccionId", "orden");

-- AddForeignKey
ALTER TABLE "Prenda" ADD CONSTRAINT "Prenda_coleccionId_fkey" FOREIGN KEY ("coleccionId") REFERENCES "Coleccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prenda" ADD CONSTRAINT "Prenda_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_prendaId_fkey" FOREIGN KEY ("prendaId") REFERENCES "Prenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_coleccionId_fkey" FOREIGN KEY ("coleccionId") REFERENCES "Coleccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
