# Copilot Instructions for english-checker

These guidelines help AI coding agents work effectively in this Next.js app. Focus on the real patterns in this repo and follow the conventions below.

## Big picture
- Framework: Next.js 14 (App Router) with client-side hooks/components and a single server API route at `app/api/check/route.js`.
- Purpose: Accept a student’s short English text, send it to Groq (OpenAI-compatible API) for grammar/spelling feedback, validate/sanitize the JSON response, render mistakes, and optionally show “Level Up” advice when there are no mistakes.
- Data flow:
  1) UI (`WritingInput`) collects text (≤ 400 chars), throttles requests (cooldown), and triggers `useChecker.checkWriting()`
  2) `useChecker` POSTs to `/api/check` with `{ text, classCode }`
  3) API route validates classCode, builds a strict prompt (`api/config/checkWritingPrompt.js`), calls Groq, strips code fences, `JSON.parse`s, and `validateAndFixResponse`
  4) Response is logged to Supabase and returned to the client
  5) UI displays score, highlights mistakes in text, lists mistakes; if there are no mistakes, shows a “レベルアップ” card with advice

## Key directories and files
- UI (client components):
  - `components/checker/WritingInput.js`: textarea with 400-char limit, custom word counter, 60s cooldown (non-TEACHER), and a copy-to-clipboard button (appears when feedback exists)
  - `components/checker/FeedbackDisplay.js`: score and highlighted text preview
  - `components/checker/MistakeList.js`: list of mistakes; shows “レベルアップ” card only when `mistakes.length === 0`
  - `components/checker/LoginForm.js`: class code entry with inline error/loading
- Hooks:
  - `hooks/useAuth.js`: stores class code in `sessionStorage`; can “validate” code by probing `/api/check`; exposes `{ classCode, isAuthenticated, login, logout, error, isLoading }`
  - `hooks/useChecker.js`: manages `studentText`, `isChecking`, `feedback`, and `checkWriting()` POST
- Server/API:
  - `app/api/check/route.js`: request queueing, class code validation, Groq call, response sanitization, Supabase logging
  - `app/api/check/queue.js`: simple in-memory queue with `REQUEST_INTERVAL=300ms`
  - `api/config/checkWritingPrompt.js`: `SYSTEM_MESSAGE`, `buildCheckPrompt(text)`, `GROQ_SETTINGS` — prompt is strict: only grammar/spelling; no stylistic/content changes; puts “levelUp” advice at top-level
  - `api/config/classCodeMap.js`: maps class codes (e.g., `CLASS11`, `TEACHER`) to env var API keys; also exports `isValidClassCode`
  - `api/utils/responseValidator.js`: ensures shape, adjusts score heuristics
  - `lib/supabaseServer.js`: `createServerClient()` with service role for server-side logging

## External integrations and env
- Groq Chat Completions endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Class-scoped API keys via env variables in `api/config/classCodeMap.js` (e.g., `GROQ_API_KEY_11`, `GROQ_API_KEY_TEACHER`)
- Supabase server logging requires:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## UI behavior and conventions
- Text input limit: 400 characters hard-capped in `WritingInput.handleTextChange`.
- Word counter: excludes proper nouns (capitalized mid-sentence), always counts “I”, excludes common Japanese loanwords (e.g., sushi, kimono). Display: `{chars}/400 · {words} 語`.
- Cooldown: 60s after “チェックする” for non-`TEACHER` class codes. Shows countdown within the button.
- Copy button: icon-only. Copies the student text, score, mistakes (original → corrected with explanation), and LevelUp advice.
- “レベルアップ” card: rendered only when `mistakes.length === 0` and `levelUp` exists.

## Prompting rules (server)
Located in `api/config/checkWritingPrompt.js` and loaded by the API route.
- Only flag grammar and spelling errors; never suggest content additions or stylistic rewrites.
- “LevelUp” is for positive improvement advice and can include more natural phrasing examples (but not as mistakes).
- Input text is truncated to 500 chars for safety.

## Developer workflows
- Install and run:
  - `npm run dev` — start Next.js dev server
  - `npm run build` — production build
  - `npm start` — start production server
- Deployment: `vercel.json` configured for Next.js; output dir is `.next`.
- Rate limiting/backoff: tune `REQUEST_INTERVAL` in `app/api/check/queue.js` if upstream throttles.
- Class code guardrails: server-side `isValidClassCode` hard-stops unauthorized class codes with 401.

## Patterns to follow when adding features
- Place new server-side config under `api/config/*` and import it from API routes with relative paths
- Keep client components “use client”; prefer small, focused hooks in `hooks/*` for stateful logic
- If extending AI output, update `responseValidator` to normalize nullable/missing fields safely
- Log server-side actions to Supabase via `createServerClient()`; failures must not break the request

## Common pitfalls
- Mixing CJS/ESM: some config uses `module.exports`; API routes import via ESM — Next.js handles interop, but prefer consistency when adding new files
- Missing envs for class codes or Supabase will cause 401s or logging failures — document new class codes and required env vars
- Do not render LevelUp with mistakes; UX expects LevelUp only on perfect submissions
- Respect the 400-char limit and cooldown; tests and UI rely on these constraints

## Useful references
- `app/page.js` — composition of auth, input, feedback, and mistakes
- `app/api/check/route.js` — end-to-end server flow
- `components/checker/WritingInput.js` — input UX constraints and copy action
- `components/checker/MistakeList.js` — LevelUp card behavior
