-- =====================================================================
--  Booking note holds
--
--  Requirement:
--    When a booking has a staff note and the patient later cancels the
--    booking, the time slot must NOT become available to others until a
--    staff member deletes the note. Deleting the note releases the slot.
--
--  This migration:
--    1) stores a patient snapshot on the note so the held slot can still
--       show who the note belongs to after the booking row is deleted
--    2) creates a safe view that exposes only the held slot keys (no note
--       text) so the patient portal can hide those slots
--    3) blocks new bookings on a noted slot at the database level
--
--  Run AFTER 20261118000000_add_booking_notes.sql
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Patient snapshot on the note (booking may be deleted later)
-- ---------------------------------------------------------------------
alter table public.booking_notes
  add column if not exists patient_name text,
  add column if not exists patient_phone text;

comment on column public.booking_notes.patient_name is
  'Snapshot of the patient name when the note was last saved; used after the booking is cancelled/deleted';
comment on column public.booking_notes.patient_phone is
  'Snapshot of the patient phone when the note was last saved';

create index if not exists booking_notes_slot_lookup_idx
  on public.booking_notes (booking_date, booking_time, therapist_name);

-- Backfill snapshots for notes that already exist.
update public.booking_notes bn
set
  patient_name = coalesce(
    bn.patient_name,
    btrim(b.patient_first_name || ' ' || b.patient_last_name)
  ),
  patient_phone = coalesce(bn.patient_phone, b.patient_phone)
from public.bookings b
where b.booking_id = bn.booking_id
  and (bn.patient_name is null or bn.patient_phone is null);

update public.booking_notes bn
set
  patient_name = coalesce(
    bn.patient_name,
    btrim(c.patient_first_name || ' ' || c.patient_last_name)
  ),
  patient_phone = coalesce(bn.patient_phone, c.patient_phone)
from public.cancellations c
where c.booking_id = bn.booking_id
  and (bn.patient_name is null or bn.patient_phone is null);

-- ---------------------------------------------------------------------
-- 2) Keep the existing access rules (idempotent)
-- ---------------------------------------------------------------------
alter table public.booking_notes enable row level security;

grant select, insert, update, delete on public.booking_notes to authenticated;
grant usage, select on sequence public.booking_notes_id_seq to authenticated;

drop policy if exists "booking_notes_staff_access" on public.booking_notes;
create policy "booking_notes_staff_access"
  on public.booking_notes
  for all
  to authenticated
  using (
    public.has_app_access('personalworkschedule')
    or public.has_app_access('workschedule')
  )
  with check (
    public.has_app_access('personalworkschedule')
    or public.has_app_access('workschedule')
  );

-- ---------------------------------------------------------------------
-- 3) Slot holds visible to the booking portals
--    Only slot keys are exposed. Note text / patient data are NOT.
--    A note is a hold while its booking is gone.
-- ---------------------------------------------------------------------
create or replace view public.booking_note_holds as
select
  bn.booking_id,
  bn.booking_date,
  bn.booking_time,
  bn.therapist_name
from public.booking_notes bn
where not exists (
  select 1
  from public.bookings b
  where b.booking_id = bn.booking_id
);

comment on view public.booking_note_holds is
  'Slots held by a staff note after the booking was cancelled/deleted. Exposes slot keys only, never note text.';

-- The view must run with the owner's privileges so the patient portal
-- (anon) can see slot holds without being able to read booking_notes.
alter view public.booking_note_holds set (security_invoker = false);

grant select on public.booking_note_holds to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) Database-level guard:
--    reject any new booking in a slot that still has a staff note.
--    The function is SECURITY DEFINER so it can see booking_notes even
--    when the insert comes from an unauthenticated patient session.
-- ---------------------------------------------------------------------
create or replace function public.prevent_booking_on_note_hold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow updates that do not move the booking to another slot
  -- (e.g. correcting the patient's name or phone).
  if tg_op = 'UPDATE'
     and new.booking_date is not distinct from old.booking_date
     and new.booking_time is not distinct from old.booking_time
     and btrim(new.therapist_name) = btrim(old.therapist_name) then
    return new;
  end if;

  if exists (
    select 1
    from public.booking_notes bn
    where bn.booking_date = new.booking_date
      and bn.booking_time = new.booking_time
      and btrim(bn.therapist_name) = btrim(new.therapist_name)
      -- Only notes whose booking is gone act as a slot hold.
      -- A note on an active booking does not block another slot.
      and not exists (
        select 1
        from public.bookings b
        where b.booking_id = bn.booking_id
      )
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'คิวนี้มีโน๊ตการเปลี่ยนแปลงค้างอยู่ กรุณาให้พนักงานลบโน๊ตก่อนจึงจะจองคิวนี้ได้';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_prevent_note_hold on public.bookings;
create trigger bookings_prevent_note_hold
  before insert or update of booking_date, booking_time, therapist_name
  on public.bookings
  for each row execute function public.prevent_booking_on_note_hold();

commit;

notify pgrst, 'reload schema';

-- =====================================================================
-- 5) Quick checks
-- =====================================================================

-- ดูคิวที่ถูกโน๊ตพักไว้ (หลังการจองถูกลบ)
-- select * from public.booking_note_holds order by booking_date, booking_time;

-- ดูโน๊ตทั้งหมดพร้อมข้อมูลคนไข้
-- select
--   booking_date, booking_time, therapist_name,
--   patient_name, patient_phone, note, updated_by, updated_at
-- from public.booking_notes
-- order by booking_date, booking_time;

-- ทดสอบว่าคิวที่ถูกพักไว้ถูกบล็อกจริง (ควร error)
-- insert into public.bookings (
--   booking_id, booking_date, booking_time, therapist_name,
--   patient_id, patient_first_name, patient_last_name, patient_phone, status
-- ) values (
--   'TEST-HOLD', current_date + 1, '09:00', 'ชื่อพนักงาน',
--   '0000000000000', 'ทดสอบ', 'ระบบ', '0000000000', 'CONFIRMED'
-- );
