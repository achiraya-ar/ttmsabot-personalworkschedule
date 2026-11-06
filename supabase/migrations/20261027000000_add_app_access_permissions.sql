-- =====================================================================
--  Shared app access permissions for the TTMSA Bot web apps
--  Run this in Supabase Dashboard > SQL Editor (or via Supabase CLI).
--  Admin Hub and PayPerCase permissions are added by later migrations
--  in the ttmsabot-adminhub repository.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Per-app access flags on the shared `profiles` table
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists can_access_personalworkschedule boolean not null default true,
  add column if not exists can_access_workschedule boolean not null default false,
  add column if not exists can_access_bookingportalmanager boolean not null default false;

comment on column public.profiles.can_access_personalworkschedule is
  'Allow this user to sign in to ttmsabot-personalworkschedule';
comment on column public.profiles.can_access_workschedule is
  'Allow this user to sign in to ttmsabot-workschedule';
comment on column public.profiles.can_access_bookingportalmanager is
  'Allow this user to sign in to ttmsabot-bookingportalmanager';

-- ---------------------------------------------------------------------
-- 2) Helper for Row Level Security (RLS) policies
--    Example:
--      using (public.has_app_access('workschedule'))
-- ---------------------------------------------------------------------
create or replace function public.has_app_access(p_app text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case lower(btrim(p_app))
      when 'personalworkschedule' then p.can_access_personalworkschedule
      when 'workschedule' then p.can_access_workschedule
      when 'bookingportalmanager' then p.can_access_bookingportalmanager
      else false
    end
    from public.profiles p
    where p.id = auth.uid()
  ), false);
$$;

revoke all on function public.has_app_access(text) from public;
grant execute on function public.has_app_access(text) to authenticated;

commit;

-- ให้ PostgREST เห็นคอลัมน์ใหม่ทันที (Supabase มักทำอัตโนมัติอยู่แล้ว)
notify pgrst, 'reload schema';

-- =====================================================================
-- 3) Manage permissions
-- =====================================================================

-- สำคัญ: ตรวจสอบว่า RLS ของ public.profiles ไม่ได้อนุญาตให้ผู้ใช้ทั่วไป
-- แก้ไขคอลัมน์ can_access_* หรือ role ของตัวเอง
-- แนะนำให้แก้สิทธิ์ผ่าน SQL Editor / service role เท่านั้น

-- ตรวจสอบว่า profiles ทุกคนมี Supabase Auth user แล้วหรือยัง
-- (ถ้าไม่มี จะไม่สามารถล็อกอินได้ และอีเมลใน Auth ต้องตรงกับ profiles.email)
-- select p.username, p.email
-- from public.profiles p
-- left join auth.users u on u.id = p.id
-- where u.id is null;

-- ดูสิทธิ์ของผู้ใช้ทั้งหมด
-- select
--   username,
--   full_name,
--   role,
--   can_access_personalworkschedule,
--   can_access_workschedule,
--   can_access_bookingportalmanager
-- from public.profiles
-- order by username;

-- ตัวอย่าง: ให้สิทธิ์เข้าใช้งานทั้ง 3 ระบบ
-- update public.profiles
-- set
--   can_access_personalworkschedule = true,
--   can_access_workschedule = true,
--   can_access_bookingportalmanager = true
-- where username = 'user01';

-- ตัวอย่าง: เพิ่มสิทธิ์เฉพาะระบบตารางปฏิบัติงาน
-- update public.profiles
-- set can_access_workschedule = true
-- where username = 'user02';

-- ตัวอย่าง: เพิ่มสิทธิ์เฉพาะระบบจัดการการจอง
-- update public.profiles
-- set can_access_bookingportalmanager = true
-- where username = 'user03';

-- ตัวอย่าง: ถ้าต้องการให้ผู้ใช้เดิมทุกคนยังเข้าได้เหมือนก่อนเปลี่ยนระบบ
-- (ตรวจสอบรายชื่อให้ดีก่อนรัน)
-- update public.profiles
-- set
--   can_access_workschedule = true,
--   can_access_bookingportalmanager = true;

-- =====================================================================
-- 4) Optional: example RLS policies
--    Front-end checks hide the UI, but RLS is what actually protects data.
--    These are SELECT examples only. If you enable RLS you must also add
--    insert/update/delete policies that match each app's real behaviour.
-- =====================================================================

-- alter table public.schedules enable row level security;
-- create policy "schedules_read_app_users"
--   on public.schedules for select to authenticated
--   using (
--     public.has_app_access('personalworkschedule')
--     or public.has_app_access('workschedule')
--     or public.has_app_access('bookingportalmanager')
--   );

-- alter table public.bookings enable row level security;
-- create policy "bookings_read_app_users"
--   on public.bookings for select to authenticated
--   using (
--     public.has_app_access('personalworkschedule')
--     or public.has_app_access('workschedule')
--     or public.has_app_access('bookingportalmanager')
--   );

-- alter table public.blockages enable row level security;
-- create policy "blockages_read_app_users"
--   on public.blockages for select to authenticated
--   using (
--     public.has_app_access('personalworkschedule')
--     or public.has_app_access('workschedule')
--     or public.has_app_access('bookingportalmanager')
--   );
