# english-checker

English writing checker for Japanese junior high school. Students open the checker directly, submit a short piece of writing, and get grammar, spelling, and vocabulary feedback from Groq. A teacher can sign in and replay recent submissions.

The app is a Next.js 14 App Router project, deployed on Vercel. Checks, teacher accounts, sessions, and the per-browser rate limit are stored in Neon (Postgres, Singapore).

## How a check works

1. The home page sends `POST /api/check` with the text, an optional topic, and a mode (`practice` or `test`).
2. The server strips HTML, enforces a 400-character limit, and counts effective words and sentences. Loanwords such as `sushi` and mid-sentence capitalized words are left out of the word count. The word `I` always counts.
3. Test writing under 15 words skips the model. It is saved as `too_short` and shown as unscored.
4. Otherwise the guest cookie `wc_session_id` is limited to one model check every 60 seconds. Requests then pass through an in-memory queue with a 300 ms gap.
5. Groq (`openai/gpt-oss-20b`, key `GROQ_API_KEY_11`) returns mistakes. When a topic is present and the writing has at least 25 words and 3 sentences, it also returns PREP topic feedback (point, reason, evidence, summary).
6. The server scores the result from the mistake list: start at 100, subtract 5 per spelling mistake and 10 per grammar or vocabulary mistake, and clamp to 0–100. The PREP checklist does not change the score.
7. The check is inserted into `checks` and returned as `{ submissionId, feedback }`.

Practice mode keeps the topic optional. Test mode assigns a topic, runs a 5-minute timer in the browser, and submits automatically when time runs out.

## Pages and endpoints

| Path | Purpose |
|---|---|
| `/` | Student checker (practice and test) |
| `/login` | Teacher sign-in form |
| `/teacher` | Last 20 checks, filtered with `?mode=all\|practice\|test` |

`/teacher` requires a valid `teacher_session` cookie. Middleware redirects everyone else to `/login`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/check` | Run a check and save it |
| `GET` | `/api/auth/me` | `{ loggedIn: true \| false }` |
| `POST` | `/api/auth/login` | Verify the teacher password and set the session cookie (7 days) |
| `POST` | `/api/auth/logout` | Delete the session and redirect to `/` |

## Development

```bash
npm install
npm run dev
```

- `npm run dev` — Next.js dev server
- `npm run lint` — ESLint (Next.js and Core Web Vitals)
- `npm run build` — lint, then production build
- `npm start` — production server
- `npm test` — unit tests with Node's built-in test runner

### Environment

Put these in `.env.local`:

- `GROQ_API_KEY_11` — Groq API key used for every check
- `DATABASE_URL` — Neon connection string

Without `DATABASE_URL`, the checker can still return feedback, but saves fail and `/teacher` shows that the database is not configured. The rate limit fails open if its table is missing.

Apply the schema, then create a teacher. Set `USERNAME` and `PASSWORD` in `scripts/create-teacher.js`, run it once, and clear the plaintext password from the file afterward.

```bash
node scripts/apply-neon-schema.mjs
node scripts/create-teacher.js
```

The script applies the SQL in `supabase/migrations` to Neon: `checks`, `teachers`, `sessions`, and `check_rate_limits`.

## Data and privacy

Students use the checker with no account. The app stores anonymous writing, AI feedback, mode, status, and timestamps. It does not store names, student IDs, or other identifying fields. The guest cookie is only a rate-limit key.

Submitted text is sent to Groq in the United States for grammar analysis. Zero Data Retention is enabled: Groq processes the text in memory and does not store prompts or responses.

A submission can incidentally contain a name if a student writes a self-introduction. That text is not collected in a structured way, is not linked to a person, and is not retained by the AI provider.

Under Japan's Act on the Protection of Personal Information (APPI), the app does not handle personal information, because it does not collect data that identifies a specific individual. Anonymous transit of free text to a third-party API with zero retention is not personal-data processing under APPI guidelines.

Teacher usernames and password hashes are stored separately so a teacher can review those anonymous submissions.
