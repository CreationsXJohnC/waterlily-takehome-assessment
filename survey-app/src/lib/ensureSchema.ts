import fs from "node:fs";
import path from "node:path";
import { getPrisma } from "@/lib/prisma";

/**
 * Best-effort runtime schema initializer.
 *
 * When ENABLE_RUNTIME_MIGRATION=1 and the primary tables are missing (P2021),
 * apply Prisma migration SQL files sequentially using a Postgres advisory lock.
 * This is a fallback to make redeploys self-healing when build-time DB URL
 * was not available. It only runs once per instance when needed.
 */
export async function ensureSchema(): Promise<void> {
  if (process.env.ENABLE_RUNTIME_MIGRATION !== "1") return;
  const prisma = getPrisma();
  try {
    // If we can query the User table, schema exists.
    await prisma.user.count();
    return;
  } catch (e: any) {
    if (e?.code !== "P2021") {
      // Not a "table does not exist" error; don't attempt migration here.
      return;
    }
  }

  // Locate migration SQL files packaged with the serverless function.
  const migRoot = path.join(process.cwd(), "prisma", "migrations");
  let sqlFiles: string[] = [];
  try {
    const entries = fs.readdirSync(migRoot, { withFileTypes: true });
    sqlFiles = entries
      .filter((e) => e.isDirectory())
      .map((e) => path.join(migRoot, e.name, "migration.sql"))
      .filter((fp) => fs.existsSync(fp));
  } catch (_) {
    // If migrations are not packaged, bail silently.
    return;
  }
  if (!sqlFiles.length) return;

  // Serialize with an advisory lock to avoid concurrent migrations.
  await prisma.$executeRawUnsafe("SELECT pg_advisory_lock(886611223);");
  try {
    // Apply in lexicographic order (Prisma migration folders are timestamped).
    sqlFiles.sort();
    for (const file of sqlFiles) {
      const sql = fs.readFileSync(file, "utf8");
      if (!sql.trim()) continue;
      await prisma.$executeRawUnsafe(sql);
    }
  } finally {
    await prisma.$executeRawUnsafe("SELECT pg_advisory_unlock(886611223);");
  }
}