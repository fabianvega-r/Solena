import { PrismaClient } from "@prisma/client";

// En desarrollo Next recarga módulos a menudo; reutilizamos una sola instancia
// para no agotar las conexiones de PostgreSQL.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
