ALTER TABLE public.writing_logs
ADD COLUMN IF NOT EXISTS student_text text;
