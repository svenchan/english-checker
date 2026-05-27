# english-checker
English grammar checker for JHS.

A Next.js web app that uses AI to help students check their own work and understand their mistakes so they can learn from them. Students now land directly on the checker—no login or class code screen—and the server always uses the single `CLASS11` Groq API key.

Published on vercel app using neon for logging mistakes and writing.

## Development

- `npm run dev` — start the Next.js dev server
- `npm run lint` — run ESLint (Next.js + Core Web Vitals rules)
- `npm run build` — run linting and create a production build
- `npm test` — run the smoke test suite (Node's built-in test runner)

### Data & Privacy

This app collects no personal information. Students access the checker directly
with no login, account, or identifying information required.

**What is stored:**
Anonymous writing submissions, AI feedback, and timestamps are saved to a
database hosted Singapore (Neon). No names, student IDs, or any
other identifying fields are stored.

**AI processing:**
Submitted text is sent to Groq's API (United States) for grammar analysis.
Zero Data Retention (ZDR) is enabled — Groq processes text in memory only
and does not store prompts or responses.

**Incidental personal information:**
Writing submissions may incidentally contain names or personal details if
students write self-introductions. This is not collected in any structured way,
cannot be linked to a specific individual, and is not retained by the AI
provider. No attempt is made to extract or store such information.

**Position under APPI:**
The app does not handle "personal information" as defined under Japan's Act on
the Protection of Personal Information (APPI), as no data is collected that
identifies a specific individual. Anonymous transit of free text to a
third-party API with zero retention is not considered personal data processing
under APPI guidelines.### Data
.
├── jsconfig.json
├── middleware.js
├── next.config.js
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.js
├── README.md
├── scripts
│   ├── apply-neon-schema.mjs
│   └── create-teacher.js
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   ├── login
│   │   │   │   ├── logout
│   │   │   │   └── me
│   │   │   └── check
│   │   │       ├── queue.js
│   │   │       └── route.js
│   │   ├── globals.css
│   │   ├── icon.svg
│   │   ├── layout.js
│   │   ├── login
│   │   │   └── page.js
│   │   ├── page.js
│   │   └── teacher
│   │       └── page.js
│   ├── config
│   │   ├── errors.js
│   │   ├── prompts.js
│   │   ├── supabase.js
│   │   ├── testMode.js
│   │   └── topicPresets.js
│   ├── features
│   │   ├── teacher
│   │   │   └── components
│   │   │       ├── CheckerReplay.js
│   │   │       ├── SubmissionSidebar.js
│   │   │       └── TeacherPageClient.js
│   │   └── writing-checker
│   │       ├── components
│   │       │   ├── FeedbackDisplay.js
│   │       │   ├── Header.js
│   │       │   ├── HighlightedText.tsx
│   │       │   ├── MistakeList.js
│   │       │   ├── ModeSidebar.js
│   │       │   ├── TopicPicker.js
│   │       │   └── WritingInput.js
│   │       ├── constants.js
│   │       ├── hooks
│   │       │   ├── useChecker.js
│   │       │   ├── useMistakeHighlight.js
│   │       │   └── useTestSession.js
│   │       ├── lib
│   │       │   ├── testSession.js
│   │       │   ├── tokenizeHighlight.ts
│   │       │   └── topicState.js
│   │       ├── services
│   │       │   └── checkingService.js
│   │       └── types
│   │           ├── checker.types.js
│   │           └── highlightTokens.ts
│   ├── lib
│   │   ├── authConstants.js
│   │   ├── authEdge.js
│   │   ├── auth.js
│   │   ├── clientSanitize.js
│   │   ├── constants.js
│   │   ├── db.js
│   │   ├── fetchChecks.js
│   │   ├── normalizeText.ts
│   │   ├── normalizeTopicText.js
│   │   ├── sanitize.js
│   │   ├── saveCheck.js
│   │   ├── utils.js
│   │   ├── validators.js
│   │   └── wordCount.js
│   ├── middleware.js
│   └── shared
│       └── components
│           └── ui
│               ├── Icons.js
│               └── Tooltip.js
├── supabase
│   └── migrations
│       ├── 20241216_test_mode.sql
│       ├── 20260219_simplified_checks.sql
│       ├── 20260519_teacher_auth_rebuild.sql
│       └── 20260519_teacher_auth.sql
├── tailwind.config.js
├── tests
│   └── unit
│       ├── clientSanitize.test.mjs
│       ├── highlightTokens.test.mjs
│       ├── normalizeTopicText.test.mjs
│       ├── prompts.test.mjs
│       ├── smoke.test.mjs
│       ├── testSession.test.mjs
│       ├── topicState.test.mjs
│       └── wordCount.test.mjs
├── tsconfig.json
└── vercel.json

