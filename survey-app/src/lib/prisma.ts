import { createRequire } from "module";

const globalForPrisma = global as unknown as { prisma?: any };

 function resolveDatasourceUrl(): string {
  // Prefer only Postgres URLs for this app (production and local).
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
  ].filter(Boolean) as string[];
  const chosen = candidates.find((u) => /^postgres(ql)?:\/\//.test(u));
  return chosen || "";
 }

function createPrisma() {
  // Ensure Prisma uses the Node-API engine locally instead of the "client" engine.
  // The "client" engine requires an adapter or Accelerate URL, which we don't use for SQLite dev.
  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  }
  const require = createRequire(import.meta.url);
  const url = resolveDatasourceUrl();
  let adapter: any = undefined;

  // Ensure Prisma picks up the URL via env for any internal validation paths.
  if (url && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url;
  }

  // Load PrismaClient from the standard package to ensure Vercel bundling works.
  const { PrismaClient } = require("@prisma/client");
  // Plain client with runtime datasource URL override.
  const client = new PrismaClient({
    log: ["error"],
    datasourceUrl: url || undefined,
  });
  return client;
}

// Lazy getter to avoid throwing during module evaluation when DB URL is missing.
// This allows API routes to catch and return clear JSON errors instead of a generic 500 page.
export function getPrisma() {
  const url = resolveDatasourceUrl();
  if (!url) {
    const err: any = new Error("Missing DATABASE_URL/POSTGRES_URL environment variable.");
    err.code = "MISSING_DATABASE_URL";
    throw err;
  }
  // Set env for downstream consumers if not already set.
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url;
  }
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const client = createPrisma();
  globalForPrisma.prisma = client;
  return client;
}