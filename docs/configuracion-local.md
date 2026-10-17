# Configuración del entorno — Solena

Pasos pendientes para dejar funcionando la base de datos y el almacenamiento de fotos.

## Estado actual

- [x] Node.js y npm instalados
- [x] Dependencias instaladas (`npm install`)
- [x] Esquema de base de datos válido y código compilando (`prisma validate`, `tsc`)
- [x] Archivo `.env` creado a partir de `.env.example`
- [x] Cuenta en Neon creada
- [x] WSL instalado (Docker Desktop lo necesita para arrancar)
- [x] `.env` con las URLs de Neon y un `ADMIN_TOKEN` propio
- [x] Tablas creadas y datos de ejemplo cargados
- [x] Almacenamiento de fotos funcionando en local (MinIO)
- [ ] Almacenamiento de fotos en producción (Cloudflare R2)

## Paso 1: instalar WSL (una sola vez)

Docker Desktop no arranca sin WSL (Subsistema de Windows para Linux).

1. Abre **PowerShell como administrador**: clic derecho en Inicio → *Terminal (Administrador)*.
2. Ejecuta:
   ```powershell
   wsl --install --no-distribution
   ```
3. **Reinicia el computador.**
4. Abre Docker Desktop y espera a que aparezca *Engine running*.

## Paso 2: conectar Neon

1. En Neon, entra a tu proyecto → botón **Connect**.
2. Copia la URL con **"Connection pooling" activado** (contiene `-pooler` en el host) y otra con el pooling **desactivado**.
3. Abre `.env` en la raíz del proyecto y reemplaza estas dos líneas:
   ```
   DATABASE_URL="postgresql://...-pooler....neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://.....neon.tech/neondb?sslmode=require"
   ```
4. Cambia también `ADMIN_TOKEN` por una clave larga inventada por ti.

> **Importante:** el `.env` contiene la contraseña de la base de datos. No lo compartas ni lo subas
> a GitHub (ya está en `.gitignore`).

## Paso 3: crear las tablas y cargar datos de ejemplo

Con el `.env` listo:

```bash
npm run db:migrate   # crea las tablas (pide un nombre para la migración, p. ej. "inicial")
npm run db:seed      # categorías y una colección de ejemplo
```

## Paso 4: almacenamiento de fotos

- **Desarrollo local:** MinIO en Docker, una vez instalado WSL:
  ```bash
  npm run db:up
  ```
  Consola de MinIO: http://localhost:9001 (usuario `solena`, clave `solena-secreto`).

  Si usas Neon para los datos, `db:up` también levanta un PostgreSQL local; no estorba, pero
  puedes levantar solo MinIO con `docker compose up -d minio minio-init`.

- **Producción:** Cloudflare R2 (10 GB gratis, ~25 000 fotos). Cloudflare pide registrar una
  tarjeta para activar R2, aunque no cobra mientras no se superen los 10 GB. Los pasos y las
  variables están en el `README.md`, sección *Despliegue gratuito*.

## Paso 5: arrancar la app

```bash
npm run dev   # http://localhost:3000
```
