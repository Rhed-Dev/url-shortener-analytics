import { PrismaClient } from "@prisma/client";

/**
 * Lazy Prisma singleton.
 *
 * The client is created on first use inside a request handler — never at
 * module import time — so `next build` succeeds with no database running.
 * The instance is cached on `globalThis` to survive hot reloads in dev.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
