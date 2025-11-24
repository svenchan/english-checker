# english-checker
English grammar checker for JHS.

A next.js webapp  that uses AI to help students check their own work and understand their mistakes so they can learn from them. It collects data on mistakes and displays it per class and per student so students and teachers can focus on areas where they strugle the most.

Published on vercel app using supabase for logging mistakes and writing.

## Development

- `npm run dev` — start the Next.js dev server
- `npm run build` — create a production build
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
│   │   ├── page.js
│   │   ├── api/
│   │   │   └── check/
│   │   └── (auth)/                  # Route groups for organization
│   │       ├── layout.js
│   │       └── login/
│   │
│   ├── features/                    # Feature-based modules (key change!)
│   │   ├── writing-checker/
│   │   │   ├── components/
│   │   │   │   ├── WritingInput.js
│   │   │   │   ├── FeedbackDisplay.js
│   │   │   │   ├── MistakeList.js
│   │   │   │   └── Header.js
│   │   │   ├── hooks/
│   │   │   │   ├── useChecker.js
│   │   │   │   └── useMistakeHighlight.js
│   │   │   ├── services/            # API calls specific to this feature
│   │   │   │   └── checkingService.js
│   │   │   ├── types/               # TypeScript types (or JSDoc)
│   │   │   │   └── checker.types.js
│   │   │   └── constants.js
│   │   │
│   │   └── auth/
│   │       ├── components/
│   │       │   └── LoginForm.js
│   │       ├── hooks/
│   │       │   └── useAuth.js
│   │       ├── services/
│   │       │   └── authService.js
│   │       └── types/
│   │           └── auth.types.js
│   │
│   ├── shared/                      # Reusable across features
│   │   ├── components/
│   │   │   └── ui/
│   │   │       ├── Icons.js
│   │   │       └── Tooltip.js
│   │   ├── hooks/
│   │   │   └── (generic hooks)
│   │   ├── services/                # Generic utilities
│   │   │   └── api.js
│   │   ├── constants/
│   │   │   └── index.js
│   │   └── types/
│   │       └── index.js
│   │
│   ├── lib/                         # Utility functions
│   │   ├── utils.js
│   │   └── validators.js            # Moved from api/utils
│   │
│   └── config/                      # Configuration
│       ├── prompts.js               # Moved from api/config
│       ├── classCodeMap.js
│       ├── errors.js
│       └── supabase.js              # Moved from lib
│
├── tests/                           # All tests organized by source
│   ├── unit/
│   └── integration/
│
└── scripts/                         # Utility scripts live here