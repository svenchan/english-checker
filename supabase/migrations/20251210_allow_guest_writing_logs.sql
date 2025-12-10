-- Allow guest log rows by making student/class/school references optional
ALTER TABLE public.writing_logs
  ALTER COLUMN student_id DROP NOT NULL,
  ALTER COLUMN class_id DROP NOT NULL,
  ALTER COLUMN school_id DROP NOT NULL;

-- Optional safety: ensure guest_session_id is still unique enough for analytics (no constraint applied here)
