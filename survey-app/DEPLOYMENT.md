Deployment notes

- Set `DATABASE_URL` to your production non-pooling Postgres URL (e.g., `postgres://...`).
- Optionally set `POSTGRES_URL_NON_POOLING` and `POSTGRES_URL` to the same database.
- Ensure variables are available at both Build and Runtime in Vercel.
- The build script attempts `prisma migrate deploy` and falls back to `prisma db push` when a valid URL is present.

Runtime self-healing (optional)

- To enable a fallback that initializes the schema at runtime if tables are missing, set `ENABLE_RUNTIME_MIGRATION=1` in Vercel.
- When enabled, the API routes will attempt to apply migration SQL files once at runtime using a Postgres advisory lock.
- This fallback is safe for simple deployments and only runs when Prisma reports `P2021` (table does not exist).

Logs to expect

- Build logs include `[db-push-if-url]` lines indicating the detected database URL source.
- Health check `GET /api/health/db` returns `{ ok: true }` when schema and connectivity are correct.