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

const url = pickDatabaseUrl();
if (!url) {
  console.log(
    "[db-push-if-url] No valid Postgres URL found; skipping DB migration."
  );
  process.exit(0);
}

const isVercel = process.env.VERCEL === "1";
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
        "[db-push-if-url] Migrate deploy failed. Attempting fallback `prisma db push` and continuing build."
      );
      const push = spawnSync(npxCmd, ["prisma", "db", "push"], {
        stdio: "inherit",
        env,
      });
      if (push.status !== 0) {
        console.warn(
          "[db-push-if-url] Fallback db push failed. Continuing build to avoid blockage."
        );
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
      console.warn(
        "[db-push-if-url] Prisma db push failed. Continuing build to avoid deployment blockage."
      );
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