import { PrismaClient } from "@/lib/generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to connect to the database.");
  }

  // The configured Neon database is shared with another application. Keep
  // FinTrack's tables isolated instead of reading or modifying its public schema.
  const url = new URL(databaseUrl);
  url.searchParams.set("schema", process.env.DATABASE_SCHEMA ?? "fintrack");
  return url.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: getDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
