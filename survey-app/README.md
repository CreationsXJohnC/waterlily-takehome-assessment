# Survey App

A multi-page intake survey built with Next.js (App Router). It includes a consent screen, seven-question flow, a review step, local persistence, and auth-gated submission.

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
