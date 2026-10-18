# Solena — guía para Claude

Catálogo web de colecciones de ropa: API + panel de administración (hecho) y catálogo público (siguiente).
Todo el proyecto (código, comentarios, interfaz, commits y respuestas) va **en español**.

## Arrancar

1. Abrir Docker Desktop (MinIO, las fotos en local, arranca solo).
2. `npm run dev` → http://localhost:3000 · panel en `/admin` (clave = `ADMIN_TOKEN`).

Otros comandos: `npm run db:migrate` (crear una migración tras cambiar `prisma/schema.prisma`), `npm run db:seed`,
`npm run db:studio`, `npx tsc --noEmit` (revisar tipos), `npx next build` (detener `next dev` antes: comparten `.next`).

## Arquitectura

| Pieza | Local | Producción |
|---|---|---|
| App | `next dev` (Next 15, App Router) | Vercel |
| Datos | Neon (también en local; el Postgres de `docker-compose` no se usa) | Neon |
| Fotos | MinIO en Docker (`cgr.dev/chainguard/minio`; las imágenes de MinIO ya no están en Docker Hub) | Cloudflare R2 (pendiente) |

- `src/lib/` es la fuente única de las reglas de negocio, compartida por la API (`src/app/api`) y el panel (`src/app/admin`):
  - `esquemas.ts`: validación zod de colecciones y prendas.
  - `publicacion.ts`: regla de "lista para publicar". La usa la interfaz (checklist) y la aplica la acción `cambiarPublicacion`.
  - `imagenes.ts`: cada foto se guarda como 3 variantes WebP (480/960/1600 px) + `blurDataUrl`.
  - `auth.ts`: `ADMIN_TOKEN` como `Bearer` (API) o cookie de sesión `solena_admin` (panel).
- Panel: páginas de servidor en `src/app/admin/(panel)/` (exigen sesión), mutaciones en `src/app/admin/acciones.ts`.
  Las fotos no pasan por acciones: el navegador las prepara (`prepararFoto.ts`, HEIC → JPG, ≤ 4 MB) y las sube a `/api/fotos`.
- Límite de Vercel: 4.5 MB por petición. La API rechaza fotos de más de 4 MB.

## Reglas

- **Nunca leer ni mostrar `.env`** ni pedir credenciales en el chat. Si una prueba necesita `ADMIN_TOKEN`, leerlo
  desde un script sin imprimirlo, y filtrar `postgres://` de la salida de Prisma. Antes de cada commit, confirmar
  que `.env` sigue ignorado y buscar `neon.tech` y `npg_` en los archivos preparados.
- Validar siempre en el servidor, aunque la interfaz ya lo impida.
- La interfaz debe ser guiada: toda acción confirma lo que pasó y dice qué sigue (avisos, estados, enlaces a lo que falta).
  El usuario no es técnico; los textos van en español llano.
- Formularios del panel: se envían con `onSubmit` + `useActionState` (no `<form action>`), porque React 19 vacía el
  formulario y se perdería lo escrito si hay un error.
- Antes de algo no trivial, exponer el diseño en pocos puntos; al terminar, decir qué se probó y qué no (por ejemplo,
  clics que requieren navegador).

## Estado (actualizar al cerrar cada etapa)

- [x] Etapa 1: base de datos, API y fotos.
- [x] Panel de administración con flujo guiado de publicación.
- [~] Etapa 2: **catálogo público**. Hecho: inicio, colección, ficha de prenda, WhatsApp con mensaje prellenado
  (`src/lib/tienda.ts`), corazones y métricas anónimas (`src/lib/metricas.ts`, panel `/admin/metricas`), enlace
  «Administrar la tienda» y barra de sesión. Falta: rediseño de la presentación (ver abajo) y las mejoras de la investigación.
- [ ] Etapa 3: Cloudflare R2 + Vercel (pasos en el README, *Despliegue gratuito*).

### Plan de mejoras (investigación: `reports/Páginas de moda para Solena.md`)

Prioridad alta:
1. ~~Rediseño del catálogo y panel claro~~ (hecho: inicio con todas las colecciones lado a lado, la más reciente
   primero; asistente Datos → Prendas → Portada → Publicar; «Sobre la marca» en `src/lib/marca.ts`; buscador y
   paginación en el panel; tallas ordenadas con `ordenarTallas`).
2. Confirmación clara al guardar cambios de prendas y colecciones existentes (la creación ya está guiada).
3. Guía de tallas en cm junto al selector de talla.
4. Medidas de la modelo («La modelo mide 1,70 y usa talla S») y campos de tela y cuidado en cada prenda.
5. Botón de WhatsApp fijo abajo en el celular, en la ficha de prenda.
6. Sección «Cómo comprar»: envíos, pagos, cambios y horario de respuesta (la gente pide pruebas de que el negocio es real).
7. Guiar al usuario para configurar WhatsApp Business (bienvenida, ausencia, respuestas rápidas, etiquetas).

Prioridad media: página de privacidad y cookies (Ley 1581); «Mis favoritos» con envío por WhatsApp; «Avísame cuando
vuelva» en prendas agotadas; historia de la marca; en métricas, cruzar corazones con toques de WhatsApp.

Prioridad baja: enlace a Instagram, segunda foto al pasar el cursor, aviso honesto de última unidad, filtro por talla.
No hacer por ahora: contador público de corazones, recomendador de talla, buscador.

Pendientes: preguntar si borrar las fotos de campaña duplicadas de «holas del mar» y «Lo que permanece en nosotros»
(la portada ahora se elige entre las fotos de las prendas). Cambios de `prisma/schema.prisma` exigen reiniciar
`npm run dev` (el cliente de Prisma queda cargado en memoria). Si las fotos se ven borrosas, MinIO está apagado:
`docker compose up -d minio` (con Docker Desktop abierto). En PowerShell usar `npm.cmd run dev` si `npm` está bloqueado.
