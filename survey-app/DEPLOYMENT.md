Deployment to Vercel

Overview
- App runs on Next.js with Prisma 6.
- Use Vercel Postgres (first-party) — no external accounts required.
- Schema is applied during the Vercel build (`prisma db push && next build`).

Prerequisites
- Vercel account and a project linked to this repo.
- Vercel Postgres database created in the Vercel dashboard.

Environment Variables (Vercel → Project → Settings → Environment Variables)
- `DATABASE_URL`: set this to the value of `POSTGRES_PRISMA_URL` exposed by Vercel Postgres.
- `JWT_SECRET`: a strong random string for signing tokens.

Steps
1) Create Vercel Postgres:
   - In Vercel, go to `Storage → Postgres → Create Database`.
   - On the database page, click `Expose envs to project` and select this app.

2) Configure env vars:
   - In your Vercel project settings, set `DATABASE_URL` to `POSTGRES_PRISMA_URL` (copy-paste the value).
   - Add `JWT_SECRET` for both Production and Preview.

3) Deploy:
   - Push to `main` or trigger a deploy in Vercel.
   - During build, Prisma will apply the schema to Vercel Postgres and generate the client.

4) Verify:
   - Visit the deployment URL.
   - Sign up, log in, complete the survey, and review responses. Or run `BASE_URL=https://<your-vercel-domain> npm run verify` locally.

Local Development
- You can keep local SQLite for dev, but production uses Postgres.
- To test against Vercel Postgres locally, set `DATABASE_URL` to your Vercel `POSTGRES_PRISMA_URL` in `.env.local`.
- Install deps: `npm install`
- Generate client: `npm run postinstall` (or `npx prisma generate`)
- Apply schema: `npx prisma db push`
- Start dev server: `npm run dev`

Notes
- Vercel's filesystem is ephemeral; SQLite files are not suitable in production.
- Using Vercel Postgres avoids third-party accounts and keeps deployment simple.