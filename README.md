# english-checker
English grammar checker for JHS.

A Next.js web app that uses AI to help students check their own work and understand their mistakes so they can learn from them. Students now land directly on the checker—no login or class code screen—and the server always uses the single `CLASS11` Groq API key behind the scenes.

Published on vercel app using supabase for logging mistakes and writing.

## Development

- `npm run dev` — start the Next.js dev server
- `npm run lint` — run ESLint (Next.js + Core Web Vitals rules)
- `npm run build` — run linting and create a production build
- `npm test` — run the smoke test suite (Node's built-in test runner)



.
├── README.md
├── package.json
├── package-lock.json
├── next.config.js
├── jsconfig.json
├── vercel.json
├── index.html
│
├── public/                          # Static assets
│   └── images/
│
├── src/                             # Main source directory
│   ├── app/                         # Next.js app router
│   │   ├── layout.js
│   │   ├── page.js                  # Main checker UI (no auth gate)
│   │   └── api/
│   │       └── check/               # Single API route that talks to Groq
│   │
│   ├── features/
│   │   └── writing-checker/         # Input, feedback UI, and hooks
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── types/
│   │       └── constants.js
│   │
│   ├── shared/                      # Reusable UI + helpers
│   │   └── components/ui
│   │
│   ├── lib/                         # Utility functions (sanitizers, validators)
│   │
│   └── config/                      # Prompt, error, and Supabase config
│
├── tests/                           # All tests organized by source
│   ├── unit/
│   └── integration/
│
└── scripts/                         # Utility scripts live here

### Environment variables

Create a `.env.local` with the following keys:

```
GROQ_API_KEY_11=sk-your-groq-key
NEXT_PUBLIC_SUPABASE_URL=...        # optional, only if you want Supabase logging
SUPABASE_SERVICE_ROLE_KEY=...       # optional, only if you log to Supabase
SUPABASE_DISABLED=true              # optional; set to "true" to turn off all Supabase reads/writes
```

The checker will always call Groq with `GROQ_API_KEY_11` and, when Supabase envs exist and Supabase is not disabled, log each submission under the `CLASS11` label for consistency.

#### Temporarily disabling Supabase

If the Supabase project is paused or unavailable, set `SUPABASE_DISABLED=true` in your environment. While this is set:

- Students still receive AI feedback; submissions and feedback are **not** stored in Supabase, only returned in the API response.
- The teacher submission history page shows a maintenance message instead of loading from the database.

To turn Supabase back on: set `SUPABASE_DISABLED=false` (or remove the variable), ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set and the project is resumed, then redeploy.
