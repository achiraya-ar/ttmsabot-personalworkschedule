-- =====================================================================
--  Cleanup old booking data (older than 90 days)
--
--  Tables:
--    public.blockages         -> block_date
--    public.bookings          -> booking_date
--    public.bookings_archive  -> booking_date (skipped if the table does not exist)
--    public.cancellations     -> booking_date
--    public.booking_notes     -> booking_date (staff notes added by the
--                                personalworkschedule/workschedule feature)
--
--  Rules:
--    - Delete only rows whose date is OLDER THAN 90 days
--      (strictly `< today - 90 days`; rows exactly 90 days old are kept).
--    - "Today" is calculated in Asia/Bangkok time.
--    - Nothing inside the last 90 days is touched.
--
--  This migration:
--    1) creates a reusable cleanup function
--    2) adds date indexes to make cleanup efficient
--    3) runs the cleanup once immediately
--    4) schedules it daily with pg_cron (if pg_cron is enabled)
--
--  Run in Supabase Dashboard > SQL Editor (or via Supabase CLI).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Reusable cleanup function
-- ---------------------------------------------------------------------
create or replace function public.cleanup_old_booking_data(
  p_retention_days integer default 90
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cutoff date;
  v_notes bigint := 0;
  v_cancellations bigint := 0;
  v_archive bigint := 0;
  v_bookings bigint := 0;
  v_blockages bigint := 0;
begin
  if p_retention_days is null or p_retention_days < 1 then
    raise exception 'p_retention_days must be at least 1';
  end if;

  -- Use the Thai date so "90 days" matches the clinic's calendar day.
  v_cutoff := (now() at time zone 'Asia/Bangkok')::date - p_retention_days;

  -- Staff notes on old bookings/cancellations
  if to_regclass('public.booking_notes') is not null then
    delete from public.booking_notes
    where booking_date < v_cutoff;
    get diagnostics v_notes = row_count;
  end if;

  -- Cancellation audit rows must go before their bookings in case of FKs.
  delete from public.cancellations
  where booking_date < v_cutoff;
  get diagnostics v_cancellations = row_count;

  -- Optional archive table (skip when this environment does not have it).
  if to_regclass('public.bookings_archive') is not null then
    execute 'delete from public.bookings_archive where booking_date < $1'
      using v_cutoff;
    get diagnostics v_archive = row_count;
  end if;

  delete from public.bookings
  where booking_date < v_cutoff;
  get diagnostics v_bookings = row_count;

  delete from public.blockages
  where block_date < v_cutoff;
  get diagnostics v_blockages = row_count;

  return jsonb_build_object(
    'cutoff_date', v_cutoff,
    'retention_days', p_retention_days,
    'booking_notes_deleted', v_notes,
    'cancellations_deleted', v_cancellations,
    'bookings_archive_deleted', v_archive,
    'bookings_deleted', v_bookings,
    'blockages_deleted', v_blockages
  );
end;
$$;

comment on function public.cleanup_old_booking_data(integer) is
  'Deletes booking-related rows older than p_retention_days (default 90) using Asia/Bangkok dates. Safe to run repeatedly.';

-- Only the database/cron service should call this. Do not expose it to
-- authenticated/anonymous app users because it can delete data.
revoke all on function public.cleanup_old_booking_data(integer) from public;
grant execute on function public.cleanup_old_booking_data(integer) to service_role;

-- ---------------------------------------------------------------------
-- 2) Indexes used by the cleanup (and by date-range queries)
-- ---------------------------------------------------------------------
create index if not exists bookings_booking_date_idx
  on public.bookings (booking_date);

create index if not exists blockages_block_date_idx
  on public.blockages (block_date);

create index if not exists cancellations_booking_date_idx
  on public.cancellations (booking_date);

do $$
begin
  if to_regclass('public.bookings_archive') is not null then
    execute
      'create index if not exists bookings_archive_booking_date_idx
       on public.bookings_archive (booking_date)';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3) Run once now (the user asked to remove existing old data)
-- ---------------------------------------------------------------------
select public.cleanup_old_booking_data(90);

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- 4) Schedule a daily run with pg_cron
--
--    pg_cron runs in UTC on Supabase. 20:00 UTC = 03:00 Asia/Bangkok.
--    If pg_cron is not enabled, enable it in:
--      Supabase Dashboard > Database > Extensions > pg_cron
--    then run the DO block below again.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute $job$
      select cron.unschedule(jobid)
      from cron.job
      where jobname = 'cleanup-old-booking-data'
    $job$;

    execute $job$
      select cron.schedule(
        'cleanup-old-booking-data',
        '0 20 * * *',
        'select public.cleanup_old_booking_data(90);'
      )
    $job$;

    raise notice 'Scheduled cleanup-old-booking-data at 20:00 UTC (03:00 Asia/Bangkok).';
  else
    raise notice 'pg_cron is not enabled. Enable it in Database > Extensions, then rerun this DO block.';
  end if;
end $$;

-- =====================================================================
-- 5) Useful checks
-- =====================================================================

-- ดูสถานะ job ที่ตั้งไว้
-- select jobid, jobname, schedule, active from cron.job
-- where jobname = 'cleanup-old-booking-data';

-- ดูประวัติการรัน
-- select * from cron.job_run_details
-- where jobid in (
--   select jobid from cron.job where jobname = 'cleanup-old-booking-data'
-- )
-- order by start_time desc
-- limit 10;

-- รันล้างข้อมูลเองแบบทันที
-- select public.cleanup_old_booking_data(90);

-- ตรวจข้อมูลที่จะถูกลบก่อนรัน (ไม่ลบจริง)
-- select 'bookings' as tbl, count(*) from public.bookings
-- where booking_date < (now() at time zone 'Asia/Bangkok')::date - 90
-- union all
-- select 'bookings_archive', count(*) from public.bookings_archive
-- where booking_date < (now() at time zone 'Asia/Bangkok')::date - 90
-- union all
-- select 'cancellations', count(*) from public.cancellations
-- where booking_date < (now() at time zone 'Asia/Bangkok')::date - 90
-- union all
-- select 'blockages', count(*) from public.blockages
-- where block_date < (now() at time zone 'Asia/Bangkok')::date - 90;
