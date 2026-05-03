-- Run this in Supabase Dashboard → SQL Editor (single project).
-- Creates tables, RLS, profile trigger on signup, and booking validation.

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  role text not null check (role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.time_slots (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint time_range_valid check (ends_at > starts_at)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.time_slots (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint bookings_slot_unique unique (slot_id)
);

-- New auth user → profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  r := coalesce(new.raw_user_meta_data->>'role', 'student');
  if r not in ('student', 'teacher') then
    r := 'student';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    r
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Normalize teacher_id on booking from slot; block self-booking
create or replace function public.enforce_booking_slot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  select ts.teacher_id into tid
  from public.time_slots ts
  where ts.id = new.slot_id;

  if tid is null then
    raise exception 'Invalid time slot';
  end if;

  new.teacher_id := tid;

  if new.student_id = tid then
    raise exception 'Cannot book your own slot';
  end if;

  return new;
end;
$$;

drop trigger if exists booking_before_insert on public.bookings;
create trigger booking_before_insert
  before insert on public.bookings
  for each row execute function public.enforce_booking_slot();

-- RLS
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.time_slots enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or role = 'teacher'
    or exists (
      select 1 from public.bookings b
      where b.student_id = profiles.id
        and b.teacher_id = auth.uid()
    )
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Subjects
drop policy if exists "subjects_select" on public.subjects;
create policy "subjects_select"
  on public.subjects for select
  to authenticated
  using (true);

drop policy if exists "subjects_teacher_write" on public.subjects;
create policy "subjects_teacher_write"
  on public.subjects for all
  to authenticated
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- Time slots
drop policy if exists "time_slots_select" on public.time_slots;
create policy "time_slots_select"
  on public.time_slots for select
  to authenticated
  using (true);

drop policy if exists "time_slots_teacher_write" on public.time_slots;
create policy "time_slots_teacher_write"
  on public.time_slots for all
  to authenticated
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- Bookings
drop policy if exists "bookings_select" on public.bookings;
create policy "bookings_select"
  on public.bookings for select
  to authenticated
  using (auth.uid() = student_id or auth.uid() = teacher_id);

drop policy if exists "bookings_insert_student" on public.bookings;
create policy "bookings_insert_student"
  on public.bookings for insert
  to authenticated
  with check (auth.uid() = student_id);

drop policy if exists "bookings_delete_own" on public.bookings;
create policy "bookings_delete_own"
  on public.bookings for delete
  to authenticated
  using (auth.uid() = student_id);

-- Slot availability for booking UI (avoids RLS hiding other students' rows on nested embed)
-- Arg order matches PostgREST (alphabetical param names: p_subject_id, p_teacher_id)
create or replace function public.subject_slots_with_status(
  p_subject_id uuid,
  p_teacher_id uuid
)
returns table (
  id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  subject_id uuid,
  subject_name text,
  is_booked boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    ts.id,
    ts.starts_at,
    ts.ends_at,
    ts.subject_id,
    s.name,
    exists (select 1 from public.bookings b where b.slot_id = ts.id)
  from public.time_slots ts
  left join public.subjects s on s.id = ts.subject_id
  where ts.teacher_id = p_teacher_id
    and ts.subject_id = p_subject_id
  order by ts.starts_at asc;
$$;

grant execute on function public.subject_slots_with_status(uuid, uuid) to authenticated;

create or replace function public.teacher_slots_with_status(p_teacher_id uuid)
returns table (
  id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  subject_id uuid,
  subject_name text,
  is_booked boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    ts.id,
    ts.starts_at,
    ts.ends_at,
    ts.subject_id,
    s.name,
    exists (select 1 from public.bookings b where b.slot_id = ts.id)
  from public.time_slots ts
  left join public.subjects s on s.id = ts.subject_id
  where ts.teacher_id = p_teacher_id
  order by ts.starts_at asc;
$$;

grant execute on function public.teacher_slots_with_status(uuid) to authenticated;
