#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function pickDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
  ].filter(Boolean);
  const valid = candidates.find((u) => /^postgres(ql)?:\/\//.test(u));
  return valid || null;
}

const isVercel = process.env.VERCEL === "1";
const url = pickDatabaseUrl();
function pickSource(u) {
  if (u && process.env.DATABASE_URL === u) return "DATABASE_URL";
  if (u && process.env.POSTGRES_URL_NON_POOLING === u) return "POSTGRES_URL_NON_POOLING";
  if (u && process.env.POSTGRES_URL === u) return "POSTGRES_URL";
  return "unknown";
}
function describeUrl(u) {
  try {
    const parsed = new URL(u);
    const host = parsed.hostname;
    const port = parsed.port || "5432";
    const db = (parsed.pathname || "/").replace(/^\//, "") || "(none)";
    const schema = parsed.searchParams.get("schema") || "public";
    return { host, port, db, schema };
  } catch {
    return { host: "(unparsed)", port: "?", db: "?", schema: "public" };
  }
}
const src = pickSource(url);
const meta = url ? describeUrl(url) : null;
if (meta && src !== "unknown") {
  console.log(
    `[db-push-if-url] Using DB URL from ${src}: host=${meta.host} port=${meta.port} db=${meta.db} schema=${meta.schema}`
  );
}
if (!url) {
  if (isVercel) {
    console.error(
      "[db-push-if-url] No valid Postgres URL at build. Set `DATABASE_URL` (prefer non-pooling) or `POSTGRES_URL_NON_POOLING` in Vercel Production env and expose at Build."
    );
    process.exit(1);
  }
  console.log(
    "[db-push-if-url] No valid Postgres URL found; skipping DB migration."
  );
  process.exit(0);
}

const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
const env = { ...process.env, DATABASE_URL: url };

function hasMigrations() {
  try {
    const migDir = path.join(__dirname, "..", "prisma", "migrations");
    const entries = fs.readdirSync(migDir, { withFileTypes: true });
    return entries.some((e) => e.isDirectory());
  } catch (_) {
    return false;
  }
}

if (isVercel) {
  const hasMig = hasMigrations();
  if (hasMig) {
    console.log(
      "[db-push-if-url] Detected Vercel with migrations. Running `prisma migrate deploy`."
    );
    const migrate = spawnSync(npxCmd, ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      env,
    });
    if (migrate.status !== 0) {
      console.warn(
        "[db-push-if-url] Migrate deploy failed. Attempting fallback `prisma db push`."
      );
      const push = spawnSync(npxCmd, ["prisma", "db", "push"], {
        stdio: "inherit",
        env,
      });
      if (push.status !== 0) {
        console.error(
          "[db-push-if-url] Fallback db push failed. Failing build to ensure schema is applied before deploy."
        );
        process.exit(push.status || 1);
      } else {
        console.log("[db-push-if-url] Fallback db push completed successfully.");
      }
    } else {
      console.log("[db-push-if-url] Prisma migrate deploy completed successfully.");
    }
  } else {
    console.log(
      "[db-push-if-url] No migrations found. Running `prisma db push` to initialize schema."
    );
    const push = spawnSync(npxCmd, ["prisma", "db", "push"], {
      stdio: "inherit",
      env,
    });
    if (push.status !== 0) {
      console.error(
        "[db-push-if-url] Prisma db push failed. Failing build to ensure schema exists before deploy."
      );
      process.exit(push.status || 1);
    } else {
      console.log("[db-push-if-url] Prisma db push completed successfully.");
    }
  }
  process.exit(0);
} else {
  console.log("[db-push-if-url] Running `prisma db push` locally.");
  const result = spawnSync(npxCmd, ["prisma", "db", "push"], {
    stdio: "inherit",
    env,
  });
  if (result.status !== 0) {
    console.error(
      "[db-push-if-url] Prisma db push failed with exit code:",
      result.status
    );
    process.exit(result.status || 1);
  }
  console.log("[db-push-if-url] Prisma db push completed successfully.");
  process.exit(0);
}