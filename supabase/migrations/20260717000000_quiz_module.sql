-- ─────────────────────────────────────────────────────────────────────────────
-- Quiz Module Migration
-- Creates all tables needed for the quiz module with proper RLS policies
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. quiz_subjects — subject catalog (read-only for students, seeded by admin)
create table if not exists public.quiz_subjects (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

alter table public.quiz_subjects enable row level security;

create policy "Anyone can read subjects" on public.quiz_subjects
  for select using (true);


-- 2. quiz_topics — topic catalog linked to subjects
create table if not exists public.quiz_topics (
  id text primary key,
  subject_id text references public.quiz_subjects(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table public.quiz_topics enable row level security;

create policy "Anyone can read topics" on public.quiz_topics
  for select using (true);


-- 3. quiz_files — documents uploaded by students for AI quiz generation
create table if not exists public.quiz_files (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null,
  size bigint not null default 0,
  content text,                  -- extracted plain text content
  raw_content text,              -- base64 encoded raw file (for PDF Gemini inlineData)
  created_at timestamptz default now()
);

alter table public.quiz_files enable row level security;

create policy "Users can view their own files" on public.quiz_files
  for select using (auth.uid() = user_id);

create policy "Users can insert their own files" on public.quiz_files
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own files" on public.quiz_files
  for delete using (auth.uid() = user_id);


-- 4. quiz_questions — questions linked to either a subject/topic or an uploaded file
create table if not exists public.quiz_questions (
  id text primary key,
  subject_id text,
  topic_id text,
  file_id text references public.quiz_files(id) on delete cascade,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  type text not null check (type in ('mcq', 'fill-blank', 'true-false', 'match', 'one-word')),
  question text not null,
  payload jsonb not null default '{}',
  correct_answer jsonb not null default '{}',
  explanation text,
  marks numeric not null default 1,
  negative_marks numeric not null default 0,
  created_at timestamptz default now()
);

alter table public.quiz_questions enable row level security;

create policy "Anyone can read seeded questions" on public.quiz_questions
  for select using (file_id is null);

create policy "Users can read their own file questions" on public.quiz_questions
  for select using (
    file_id is not null and
    exists (
      select 1 from public.quiz_files
      where quiz_files.id = quiz_questions.file_id
        and quiz_files.user_id = auth.uid()
    )
  );

create policy "Users can insert questions for their own files" on public.quiz_questions
  for insert with check (
    file_id is null or
    exists (
      select 1 from public.quiz_files
      where quiz_files.id = quiz_questions.file_id
        and quiz_files.user_id = auth.uid()
    )
  );


-- 5. quiz_attempts — records each quiz session submission
create table if not exists public.quiz_attempts (
  id text primary key,
  student_id uuid references auth.users(id) on delete cascade not null,
  subject_id text,
  subject_name text,
  topic_id text,
  topic_name text,
  file_id text references public.quiz_files(id) on delete set null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  total_questions integer not null default 0,
  timer_enabled boolean not null default false,
  timer_duration integer not null default 0,
  time_taken_seconds integer not null default 0,
  score numeric not null default 0,
  max_score numeric not null default 0,
  percentage numeric not null default 0,
  grade text,
  accuracy numeric not null default 0,
  created_at timestamptz default now()
);

alter table public.quiz_attempts enable row level security;

create policy "Users can view their own attempts" on public.quiz_attempts
  for select using (auth.uid() = student_id);

create policy "Users can insert their own attempts" on public.quiz_attempts
  for insert with check (auth.uid() = student_id);


-- 6. quiz_attempt_answers — per-question answer records for each attempt
create table if not exists public.quiz_attempt_answers (
  id text primary key,
  attempt_id text references public.quiz_attempts(id) on delete cascade not null,
  question_id text references public.quiz_questions(id) on delete cascade not null,
  student_answer jsonb,
  is_correct boolean not null default false,
  is_bookmarked boolean not null default false,
  is_skipped boolean not null default false,
  time_spent_seconds integer not null default 0,
  created_at timestamptz default now()
);

alter table public.quiz_attempt_answers enable row level security;

create policy "Users can view their own attempt answers" on public.quiz_attempt_answers
  for select using (
    exists (
      select 1 from public.quiz_attempts
      where quiz_attempts.id = quiz_attempt_answers.attempt_id
        and quiz_attempts.student_id = auth.uid()
    )
  );

create policy "Users can insert their own attempt answers" on public.quiz_attempt_answers
  for insert with check (
    exists (
      select 1 from public.quiz_attempts
      where quiz_attempts.id = quiz_attempt_answers.attempt_id
        and quiz_attempts.student_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Computer Science and Mathematics subjects and topics
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.quiz_subjects (id, name) values
  ('cs-001', 'Computer Science'),
  ('math-001', 'Mathematics')
on conflict (id) do nothing;

insert into public.quiz_topics (id, subject_id, name) values
  ('cs-t-001', 'cs-001', 'Data Structures'),
  ('cs-t-002', 'cs-001', 'Algorithms'),
  ('cs-t-003', 'cs-001', 'Operating Systems'),
  ('math-t-001', 'math-001', 'Calculus'),
  ('math-t-002', 'math-001', 'Linear Algebra'),
  ('math-t-003', 'math-001', 'Discrete Mathematics')
on conflict (id) do nothing;
