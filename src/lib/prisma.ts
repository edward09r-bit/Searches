import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton: hot-reload re-evaluates this module
// on every edit, which would otherwise exhaust DB connections by creating a
// fresh PrismaClient each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
