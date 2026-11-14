# Solena — catálogo de colecciones

Base de datos y API para mostrar colecciones de ropa con sus fotos.

- **Datos** (colecciones, prendas, categorías, información de cada foto): PostgreSQL + Prisma.
- **Fotos**: almacenamiento compatible con S3. Cada foto subida se convierte en 3 variantes WebP
  (480, 960 y 1600 px) y una miniatura desenfocada para la carga progresiva.

| Entorno    | App         | Base de datos   | Fotos         |
|------------|-------------|-----------------|---------------|
| Local      | `next dev`  | Postgres (Docker) | MinIO (Docker) |
| Producción | Vercel      | Neon            | Vercel Blob   |

El código es el mismo en los dos entornos; solo cambian las variables de `.env`.

## Requisitos

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (solo para desarrollo local)

## Arranque local

```bash
cp .env.example .env
npm install
npm run db:up        # Postgres + MinIO
npm run db:migrate   # crea las tablas (la primera vez pide un nombre, p. ej. "inicial")
npm run db:seed      # categorías y una colección de ejemplo
npm run dev          # http://localhost:3000
```

- Panel de administración: http://localhost:3000/admin — la clave es el valor de `ADMIN_TOKEN`.
- Consola de MinIO (ver las fotos subidas): http://localhost:9001 — usuario `solena`, clave `solena-secreto`.
- Ver y editar datos a mano: `npm run db:studio`.

## API

Lectura (pública):

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/colecciones` | Colecciones publicadas con su portada |
| GET | `/api/prendas?coleccion=&categoria=&disponible=` | Prendas con sus fotos |
| GET | `/api/categorias` | Categorías |

## Panel de administración

En `/admin` se crean y editan colecciones y prendas, y se suben sus fotos (arrastrándolas o eligiéndolas).
Antes de subir, el navegador convierte las fotos HEIC del iPhone a JPG y reduce las grandes para no pasar
el límite de 4 MB. Desde ahí también se ordenan (la primera es la principal o la portada), se les escribe
una descripción y se borran.

### Publicar una colección

Toda colección nueva empieza como **borrador** (no se ve en el catálogo ni en la API pública). En su página,
el recuadro *Publicación* muestra qué falta:

- **Obligatorio:** al menos una prenda, y todas las prendas con al menos una foto.
- **Recomendado:** fotos de campaña, descripción, fecha de lanzamiento (ordena el catálogo) y precios.

El botón *Publicar colección* se activa cuando lo obligatorio está completo; el servidor vuelve a
comprobarlo al publicar (regla en `src/lib/publicacion.ts`). *Pasar a borrador* la oculta sin borrar nada.

### Sesión

El panel pide `ADMIN_TOKEN` una sola vez y guarda una cookie de sesión de 30 días. Cambiar `ADMIN_TOKEN`
cierra todas las sesiones.

Administración por API (requiere `Authorization: Bearer <ADMIN_TOKEN>` o la cookie de sesión del panel):

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/colecciones` | Crear colección (JSON) |
| POST | `/api/prendas` | Crear prenda (JSON) |
| POST | `/api/fotos` | Subir foto (multipart: `archivo` + `prendaId` o `coleccionId`, `alt` opcional) |
| PATCH | `/api/fotos/:id` | Cambiar `alt` u `orden` |
| DELETE | `/api/fotos/:id` | Borrar foto (base de datos y archivos) |
| GET | `/api/uso` | Número de fotos y MB usados |

Ejemplo de subida:

```bash
curl -X POST http://localhost:3000/api/fotos \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F archivo=@vestido.jpg -F prendaId=<id> -F alt="Vestido de lino arena, vista frontal"
```

Cada foto devuelta incluye `urls.sm|md|lg`, `srcSet`, `ancho`, `alto` y `blurDataUrl`.

## Despliegue gratuito

Todo en planes gratis y sin tarjeta: Vercel (Hobby), Vercel Blob (fotos) y Neon (base de datos).

1. **Neon** (https://neon.com) → crea un proyecto. Copia la URL *pooled* en `DATABASE_URL` y la
   *direct* en `DIRECT_URL`. Crea las tablas desde tu equipo: `npm run db:deploy`.
2. **Vercel Blob** → en vercel.com: *Storage → Create → Blob*. En la pestaña *.env.local* copia
   `BLOB_READ_WRITE_TOKEN` a tu `.env`.
3. **Copia las fotos** de MinIO a Vercel Blob (con Docker encendido): `npm run fotos:copiar-a-blob`. Al final
   muestra `FOTOS_URL_PUBLICA=…`: agrégala al `.env`. Desde ahí tu equipo también guarda las fotos en Vercel Blob
   (si existe `BLOB_READ_WRITE_TOKEN`, `src/lib/storage.ts` lo usa en vez de MinIO).
4. **Vercel** → *Add New → Project* → importa el repositorio. Antes de *Deploy*, en *Environment Variables*:
   `DATABASE_URL`, `DIRECT_URL`, `ADMIN_TOKEN` (nueva, 32+ caracteres), `BLOB_READ_WRITE_TOKEN` y
   `FOTOS_URL_PUBLICA`. Conecta el Blob al proyecto (*Storage → tu Blob → Connect Project*).

> La base de datos de Neon es la misma para tu equipo y para el sitio publicado: lo que hagas en el panel local
> se ve en el sitio real.

### Límites a tener en cuenta

- **Vercel acepta como máximo 4.5 MB por petición.** La API rechaza fotos de más de 4 MB; el panel ya las
  reduce en el navegador antes de subirlas. Si subes por API directamente, redúcelas tú.
- **Vercel Blob gratis: 1 GB** (y 10 GB de transferencia al mes). Con ~400 KB por foto (las 3 variantes juntas)
  caben unas **2 500 fotos**. Si se pasa, Vercel no cobra: pausa las fotos hasta el mes siguiente. Vigila el uso
  en el panel, página *Espacio*, y elimina colecciones antiguas desde ahí.
- **Neon gratuito: 1 GB** de base de datos. Solo guarda texto, así que alcanza para cientos de miles de prendas.
