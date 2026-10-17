-- 08_patch_stream_thumbnail.sql  [Incremental Patch]
-- Every database, after 01, any number of times.
--
-- `stream_slots.thumbnail_url` was the only link column without an `https://` check in the database (the API already enforces it, but the
-- Table Editor and any direct insert did not). This adds the same check the other columns have (null stays allowed).
--
-- Nothing is rewritten or deleted. If a stored row already breaks the rule the constraint is not added and a notice says how many rows
-- to fix in the Table Editor; run this file again afterwards. A new database already has the check from 01_schema.sql.

do $$
declare
  v_invalid bigint;
begin
  if exists (select 1 from pg_constraint where conrelid = 'public.stream_slots'::regclass and conname = 'stream_slots_thumbnail_url_check') then
    return;
  end if;

  select count(*) into v_invalid from public.stream_slots where thumbnail_url is not null and thumbnail_url !~ '^https://';

  if v_invalid > 0 then
    raise notice 'stream_slots: % row(s) have a thumbnail_url that does not start with https://. Fix or clear them, then run this file again.', v_invalid;
  else
    alter table public.stream_slots add constraint stream_slots_thumbnail_url_check check (thumbnail_url ~ '^https://');
  end if;
end;
$$;
