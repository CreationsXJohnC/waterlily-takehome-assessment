# Survey App

**Technical Specifications**
- Frontend: `Next.js 16` (App Router), React 19 client pages for survey flow
- Styling: Tailwind CSS 4 (PostCSS), minimal custom styles
- Auth: JWT-based auth; server-side verification via `src/lib/auth.ts` and `src/middleware.ts`
- Routing: App Router pages under `src/app`; protected `responses` route
- State: Local persistence with `localStorage:intake_answers`; server writes via Prisma
- Backend: Next.js API routes; Prisma Client for data access
- Database: PostgreSQL (Vercel Postgres or standard Postgres)
- ORM: `Prisma 6.19.0`; generator output at `src/generated/prisma`
- Prisma Datasource: `prisma/schema.prisma` uses `env("DATABASE_URL")`; no `prisma.config.ts`
- Build: `node scripts/db-push-if-url.js && next build` (conditional `prisma db push`)
- Deployment: Vercel-only; Postgres URL from `DATABASE_URL` (postgres scheme)
- Env Vars: `DATABASE_URL`, `JWT_SECRET`; optional `POSTGRES_URL(_NON_POOLING)`
- Verification: `npm run verify` hits auth, survey, submit, and responses

**Build & Architecture Review**
- Project structure centers on `src/app` for survey pages (`/survey`, `/survey/[step]`, `/survey/review`) and a protected `/responses` page. Client components manage step-by-step inputs and write to `localStorage` for snappy UX and resilience against refreshes.
- Auth uses signed cookies/JWT. Middleware checks `JWT_SECRET` and gates access to `/responses`. On submit, server-side handlers create `User`, `Survey`, `Response`, and `Answer` records via Prisma.
- Data modeling in Prisma enforces relational integrity:
  - `User` ↔ `Response` (1:N)
  - `Survey` ↔ `Question` (1:N)
  - `Response` ↔ `Answer` (1:N)
  - `Answer` ↔ `Question` (N:1)
  - Cascade deletes on relations ensure orphan-free cleanup.
Database provider is PostgreSQL. The Prisma datasource reads directly from `env("DATABASE_URL")`. The build script (`scripts/db-push-if-url.js`) attempts `prisma migrate deploy` and falls back to `prisma db push` only when a valid Postgres URL is present; if the URL is missing or points to an invalid host, the build fails fast with a clear log message.
- Deployment is streamlined for Vercel:
  - Provision Postgres and expose vars in Project → Storage.
  - Set `DATABASE_URL` to a `postgres://` (not `prisma://`).
  - Build triggers `prisma generate` and a conditional `db push`; `next build` compiles the App Router.
- Local development remains simple:
  - `npm install && npm run dev` at `http://localhost:3000/`.
  - `JWT_SECRET` defaults for local preview; set explicitly for auth testing.
  - Optional: point `DATABASE_URL` to your local or hosted Postgres for full round-trip testing.
- Safety and robustness:
  - Prisma Client loaded dynamically to avoid Turbopack static resolution before generation.
  - Build guards eliminate brittle dependency on env timing.
  - Sensitive credentials should be rotated if exposed; update `DATABASE_URL` accordingly.

A multi-page intake survey built with Next.js (App Router). It includes a consent screen, seven-question flow, a review step, local persistence, and auth-gated submission.

## Deployment Fixes & Summary

- Removed legacy `vercel.json` `functions` pattern (`api/**`) to align with App Router structure under `src/app/api/...`.
- Pinned Node.js to `20.x` in `package.json` for stable builds; optionally mirror in Vercel Project Settings.
- Prisma updated to use `env("DATABASE_URL")` in `prisma/schema.prisma`; deleted `prisma.config.ts` so the CLI respects environment variables.
- Build hardening via `scripts/db-push-if-url.js`:
  - Fails builds if `DATABASE_URL` is missing or clearly invalid.
  - Tries `prisma migrate deploy`; falls back to `prisma db push` with concise `[db-push-if-url]` logs.
- Runtime resilience with `ensureSchema()` across DB-touching routes to auto-apply bundled migration SQL when tables are missing.
- Bundled migration artifacts with `outputFileTracingIncludes` in `next.config.ts` for reliable serverless execution.
- Cleaned up noise files: removed `help`, `help-wal`, and `README.init.md`.
- Vercel Project Settings:
  - Root Directory: `survey-app`
  - Build Command: `npm run build`
  - Node.js Version: `20.x`
  - Redeploy with “Clear build cache” whenever env vars change

### Verification After Deploy
- Health: `GET /api/health/db` should return `{ ok: true, datasourceUrlDetected: true }`.
- Script: `BASE_URL=https://<your-domain> npm run verify` to test signup/login, survey fetch, submission, and fetching responses.

## Features

- Multi-step survey with 7 questions, one per page
- Dedicated consent page before starting the survey
- Local persistence of answers in `localStorage` (`intake_answers`)
- Review page with edit links back to each step
- Required-answer highlighting and submit gating
- Auth requirement to submit responses

## Routes

- `/survey` — Consent page (Yes/No). Selecting “Yes” starts the survey and clears any previous answers.
- `/survey/[step]` — Steps 1–7. Answers are saved locally as you type/select.
- `/survey/review` — Review all answers, edit any step, and submit.
- `/responses` — Protected route; requires authentication (middleware enforced).
- API: `/api/auth/status` — Returns `{ authenticated: boolean }` based on server-side cookie.

## Getting Started

1) Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

2) Configure auth (optional for local preview, recommended):

- Set `JWT_SECRET` in your environment (e.g., `.env.local`). Default is `dev-secret-change-me`.

## Behavior Details

- Answers persist in `localStorage` under the key `intake_answers`.
- The review page shows a “Required” badge for any required question without an answer and disables the `Submit` button until all required answers are filled and the user is signed in.
- `Submit` navigates to `/responses`. Unauthenticated users are redirected to `/login?redirect=/responses` by middleware.

## Tech Notes

- Next.js App Router with client components for survey pages.
- Auth utilities live in `src/lib/auth.ts` and are checked server-side in `src/middleware.ts`.
- Survey questions are centralized in `src/lib/surveyQuestions.ts` and imported by both the step and review pages.

## Contributing

- Keep question updates in `src/lib/surveyQuestions.ts` so step and review pages stay in sync.
- Avoid storing PII in localStorage beyond the survey responses during development.
