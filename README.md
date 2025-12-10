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


### supabase schema

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  join_token text NOT NULL DEFAULT "substring"((gen_random_uuid())::text, 1, 16) UNIQUE,
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  class_id uuid NOT NULL,
  school_id uuid NOT NULL,
  student_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  joined_at timestamp with time zone,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.teacher_classes (
  teacher_id uuid NOT NULL,
  class_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teacher_classes_pkey PRIMARY KEY (teacher_id, class_id),
  CONSTRAINT teacher_classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT teacher_classes_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  school_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teachers_pkey PRIMARY KEY (id),
  CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT teachers_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['student'::text, 'teacher'::text, 'admin'::text])),
  first_name text,
  last_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id)
);
CREATE TABLE public.writing_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid NOT NULL,
  school_id uuid NOT NULL,
  prompt text,
  ai_response text,
  tokens_in integer,
  tokens_out integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  guest_session_id text,
  is_guest boolean DEFAULT false,
  CONSTRAINT writing_logs_pkey PRIMARY KEY (id),
  CONSTRAINT writing_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT writing_logs_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT writing_logs_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);