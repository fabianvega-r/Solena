# Solena — catálogo de colecciones

Base de datos y API para mostrar colecciones de ropa con sus fotos.

- **Datos** (colecciones, prendas, categorías, información de cada foto): PostgreSQL + Prisma.
- **Fotos**: almacenamiento compatible con S3. Cada foto subida se convierte en 3 variantes WebP
  (480, 960 y 1600 px) y una miniatura desenfocada para la carga progresiva.

| Entorno    | App         | Base de datos   | Fotos         |
|------------|-------------|-----------------|---------------|
| Local      | `next dev`  | Postgres (Docker) | MinIO (Docker) |
| Producción | Vercel      | Neon            | Cloudflare R2 |

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

- Consola de MinIO (ver las fotos subidas): http://localhost:9001 — usuario `solena`, clave `solena-secreto`.
- Ver y editar datos a mano: `npm run db:studio`.

## API

Lectura (pública):

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/colecciones` | Colecciones publicadas con su portada |
| GET | `/api/prendas?coleccion=&categoria=&disponible=` | Prendas con sus fotos |
| GET | `/api/categorias` | Categorías |

Administración (requiere `Authorization: Bearer <ADMIN_TOKEN>`):

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

1. **Neon** (https://neon.com) → crea un proyecto. Copia la URL *pooled* en `DATABASE_URL` y la
   *direct* en `DIRECT_URL`.
2. **Cloudflare R2** → crea el bucket `solena`, activa el acceso público (subdominio `r2.dev` o un
   dominio propio) y crea un token de API con permiso de lectura y escritura sobre el bucket.
   - `S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `S3_REGION=auto`, `S3_FORCE_PATH_STYLE=false`
   - `S3_PUBLIC_URL=https://<subdominio>.r2.dev`
3. **Vercel** → importa el repositorio y pega todas las variables de `.env` en *Settings → Environment Variables*.
4. Crea las tablas en Neon desde tu equipo: `DATABASE_URL=... DIRECT_URL=... npm run db:deploy`.

### Límites a tener en cuenta

- **Vercel acepta como máximo 4.5 MB por petición.** La API rechaza fotos de más de 4 MB, así que el
  panel de administración (siguiente etapa) debe reducirlas en el navegador antes de subirlas.
  Las fotos de iPhone en HEIC también deben convertirse a JPG ahí.
- **R2 gratuito: 10 GB.** Con ~400 KB por foto (las 3 variantes juntas) caben unas **25 000 fotos**.
  Consulta el uso real en `/api/uso`.
- **Neon gratuito: 1 GB** de base de datos. Solo guarda texto, así que alcanza para cientos de miles de prendas.
