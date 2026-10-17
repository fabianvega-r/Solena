// Datos de ejemplo para desarrollo: categorías básicas y una colección con dos prendas.
// Las fotos se suben luego por la API (POST /api/fotos).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categorias = [
  { slug: "vestidos", nombre: "Vestidos" },
  { slug: "blusas", nombre: "Blusas" },
  { slug: "pantalones", nombre: "Pantalones" },
  { slug: "faldas", nombre: "Faldas" },
  { slug: "chaquetas", nombre: "Chaquetas" },
  { slug: "accesorios", nombre: "Accesorios" },
];

async function main() {
  for (const [orden, c] of categorias.entries()) {
    await prisma.categoria.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, orden },
    });
  }

  const coleccion = await prisma.coleccion.upsert({
    where: { slug: "primavera-2026" },
    update: {},
    create: {
      slug: "primavera-2026",
      nombre: "Primavera",
      temporada: "Primavera 2026",
      descripcion: "Colección de ejemplo creada por el seed.",
      publicada: true,
      fechaLanzamiento: new Date("2026-03-01"),
    },
  });

  const vestidos = await prisma.categoria.findUniqueOrThrow({ where: { slug: "vestidos" } });
  const blusas = await prisma.categoria.findUniqueOrThrow({ where: { slug: "blusas" } });

  await prisma.prenda.upsert({
    where: { slug: "vestido-lino-arena" },
    update: {},
    create: {
      slug: "vestido-lino-arena",
      nombre: "Vestido de lino",
      descripcion: "Vestido midi en lino, corte recto.",
      precio: 189000,
      tallas: ["XS", "S", "M", "L"],
      colores: ["Arena", "Negro"],
      destacada: true,
      coleccionId: coleccion.id,
      categoriaId: vestidos.id,
    },
  });

  await prisma.prenda.upsert({
    where: { slug: "blusa-seda-hueso" },
    update: {},
    create: {
      slug: "blusa-seda-hueso",
      nombre: "Blusa de seda",
      precio: 129000,
      tallas: ["S", "M", "L"],
      colores: ["Hueso"],
      orden: 1,
      coleccionId: coleccion.id,
      categoriaId: blusas.id,
    },
  });
}

main()
  .then(() => console.log("Seed completado."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
