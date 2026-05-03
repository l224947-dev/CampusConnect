-- Run in Supabase SQL Editor (once), after schema.sql.
-- 1) Slot delete cascades to bookings so teachers can remove slots/classes cleanly.
-- 2) RPC exposes is_booked without leaking other students' booking rows (RLS-safe).
-- 3) Students can cancel their own bookings.

-- CASCADE: deleting a time_slot removes its booking row
alter table public.bookings
  drop constraint if exists bookings_slot_id_fkey;

alter table public.bookings
  add constraint bookings_slot_id_fkey
  foreign key (slot_id)
  references public.time_slots (id)
  on delete cascade;

-- Parameter order: p_subject_id first (matches PostgREST / schema cache)
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

drop policy if exists "bookings_delete_own" on public.bookings;
create policy "bookings_delete_own"
  on public.bookings for delete
  to authenticated
  using (auth.uid() = student_id);
