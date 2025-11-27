import { createRequire } from "module";

const globalForPrisma = global as unknown as { prisma?: any };

function resolveDatasourceUrl(): string {
  // Prefer Postgres URLs in production; allow libsql:// during local dev.
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
  ].filter(Boolean) as string[];
  const chosen = candidates.find((u) => /^postgres(ql)?:\/\//.test(u) || u.startsWith("libsql://") || u.startsWith("file:"));
  return chosen || "";
}

function createPrisma() {
  // Ensure Prisma uses the Node-API engine locally instead of the "client" engine.
  // The "client" engine requires an adapter or Accelerate URL, which we don't use for SQLite dev.
  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  }
  const require = createRequire(import.meta.url);
  // Use eval("require") to prevent Next/Turbopack from statically analyzing
  // libSQL dependencies during local dev with SQLite.
  const dynamicRequire = (id: string) => (eval("require") as any)(id);
  const url = resolveDatasourceUrl();
  let adapter: any = undefined;

  if (url && url.startsWith("libsql://")) {
    try {
      const libsql = dynamicRequire("@libsql/client");
      const { createClient } = libsql;
      const { PrismaLibSQL } = dynamicRequire("@prisma/adapter-libsql");
      const libsqlClient = createClient({
        url,
        authToken: process.env.LIBSQL_AUTH_TOKEN,
      });
      adapter = new PrismaLibSQL(libsqlClient);
    } catch {
      adapter = undefined;
    }
  }

  // Load PrismaClient after environment is configured to avoid defaulting to the "client" engine.
  const { PrismaClient } = (eval("require") as any)("../generated/prisma/client");

  if (adapter) {
    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  }

  // Without libSQL adapter, fall back to a plain client with runtime datasource URL override.
  const client = new PrismaClient({
    log: ["error"],
    datasourceUrl: url || undefined,
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;