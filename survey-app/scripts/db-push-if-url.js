#!/usr/bin/env node
const { spawnSync } = require("node:child_process");

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

if (isVercel) {
  console.log(
    "[db-push-if-url] Detected Vercel. Running `prisma migrate deploy` (non-blocking if it fails)."
  );
  const result = spawnSync(npxCmd, ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env,
  });
  if (result.status !== 0) {
    console.warn(
      "[db-push-if-url] Prisma migrate deploy failed. Continuing build to avoid deployment blockage."
    );
    process.exit(0);
  }
  console.log(
    "[db-push-if-url] Prisma migrate deploy completed successfully."
  );
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