import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Giữ singleton cả trong production để tránh exhaust DB connections
globalForPrisma.prisma = prisma;
