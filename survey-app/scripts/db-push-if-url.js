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
    "[db-push-if-url] No valid Postgres URL found; skipping `prisma db push`."
  );
  process.exit(0);
}

console.log("[db-push-if-url] Running `prisma db push` with provided URL.");
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["prisma", "db", "push", "--url", url],
  { stdio: "inherit" }
);

if (result.status !== 0) {
  console.error(
    "[db-push-if-url] Prisma db push failed with exit code:",
    result.status
  );
  process.exit(result.status || 1);
}

console.log("[db-push-if-url] Prisma db push completed successfully.");
process.exit(0);