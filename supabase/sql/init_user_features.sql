-- Enable UUID helpers if not already enabled
create extension if not exists pgcrypto;

-- Favorites table
create table if not exists public.favorite_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  name text not null,
  gif_url text not null,
  target text not null,
  body_part text not null,
  equipment text not null,
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

-- Programs table
create table if not exists public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Program exercises table
create table if not exists public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.workout_programs(id) on delete cascade,
  exercise_id text not null,
  name text not null,
  gif_url text not null,
  target text not null,
  body_part text not null,
  equipment text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Training logs table for calendar track records
create table if not exists public.training_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  category text not null,
  exercise text not null,
  exercise_id text,
  workout_date timestamptz not null,
  total_exp integer not null default 0,
  total_sets integer not null default 0,
  sets_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, session_id)
);

create index if not exists idx_favorite_exercises_user_id on public.favorite_exercises(user_id);
create index if not exists idx_workout_programs_user_id on public.workout_programs(user_id);
create index if not exists idx_program_exercises_program_id on public.program_exercises(program_id);
create index if not exists idx_training_logs_user_id on public.training_logs(user_id);
create index if not exists idx_training_logs_workout_date on public.training_logs(workout_date);

alter table public.favorite_exercises enable row level security;
alter table public.workout_programs enable row level security;
alter table public.program_exercises enable row level security;
alter table public.training_logs enable row level security;

-- Favorites policies
drop policy if exists "favorite_select_own" on public.favorite_exercises;
create policy "favorite_select_own"
  on public.favorite_exercises for select
  using (auth.uid() = user_id);

drop policy if exists "favorite_insert_own" on public.favorite_exercises;
create policy "favorite_insert_own"
  on public.favorite_exercises for insert
  with check (auth.uid() = user_id);

drop policy if exists "favorite_delete_own" on public.favorite_exercises;
create policy "favorite_delete_own"
  on public.favorite_exercises for delete
  using (auth.uid() = user_id);

-- Programs policies
drop policy if exists "program_select_own" on public.workout_programs;
create policy "program_select_own"
  on public.workout_programs for select
  using (auth.uid() = user_id);

drop policy if exists "program_insert_own" on public.workout_programs;
create policy "program_insert_own"
  on public.workout_programs for insert
  with check (auth.uid() = user_id);

drop policy if exists "program_update_own" on public.workout_programs;
create policy "program_update_own"
  on public.workout_programs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "program_delete_own" on public.workout_programs;
create policy "program_delete_own"
  on public.workout_programs for delete
  using (auth.uid() = user_id);

-- Program exercises policies (owner via parent program)
drop policy if exists "program_ex_select_own" on public.program_exercises;
create policy "program_ex_select_own"
  on public.program_exercises for select
  using (
    exists (
      select 1 from public.workout_programs wp
      where wp.id = program_exercises.program_id and wp.user_id = auth.uid()
    )
  );

drop policy if exists "program_ex_insert_own" on public.program_exercises;
create policy "program_ex_insert_own"
  on public.program_exercises for insert
  with check (
    exists (
      select 1 from public.workout_programs wp
      where wp.id = program_exercises.program_id and wp.user_id = auth.uid()
    )
  );

drop policy if exists "program_ex_update_own" on public.program_exercises;
create policy "program_ex_update_own"
  on public.program_exercises for update
  using (
    exists (
      select 1 from public.workout_programs wp
      where wp.id = program_exercises.program_id and wp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_programs wp
      where wp.id = program_exercises.program_id and wp.user_id = auth.uid()
    )
  );

drop policy if exists "program_ex_delete_own" on public.program_exercises;
create policy "program_ex_delete_own"
  on public.program_exercises for delete
  using (
    exists (
      select 1 from public.workout_programs wp
      where wp.id = program_exercises.program_id and wp.user_id = auth.uid()
    )
  );

-- Training logs policies
drop policy if exists "training_logs_select_own" on public.training_logs;
create policy "training_logs_select_own"
  on public.training_logs for select
  using (auth.uid() = user_id);

drop policy if exists "training_logs_insert_own" on public.training_logs;
create policy "training_logs_insert_own"
  on public.training_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "training_logs_update_own" on public.training_logs;
create policy "training_logs_update_own"
  on public.training_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "training_logs_delete_own" on public.training_logs;
create policy "training_logs_delete_own"
  on public.training_logs for delete
  using (auth.uid() = user_id);
