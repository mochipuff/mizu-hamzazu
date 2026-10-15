-- 04_patch_existing.sql  [Incremental Patch]
-- ONLY for a database that was built from the old README (with Korean text and viewer notes). A new database does not need it:
-- 01 to 03 already create the final shape.
--
-- Order on an existing database: 01_schema.sql (creates what is missing: site_settings, api_keys, and leaves the rest alone),
-- 02_api_keys.sql, then this file. Run 03_seed.sql only if you want the guerilla_mode row from it; the API treats a missing row as "off".
-- Deploy the new API after this patch, never before.

-- Viewer notes are gone.
drop table if exists public.viewers_notes;

-- Korean is gone: strip its text, then tighten the checks to the three languages that remain.
update public.likes_dislikes set label = label - 'kr' where label ? 'kr';
update public.stream_slots set description = description - 'kr' where description ? 'kr';

alter table public.likes_dislikes drop constraint if exists likes_dislikes_label_check;
alter table public.likes_dislikes add constraint likes_dislikes_label_check check (label ?& array['en', 'jp', 'id']);

alter table public.stream_slots drop constraint if exists stream_slots_description_check;
alter table public.stream_slots add constraint stream_slots_description_check check (description ?& array['en', 'jp', 'id']);

-- Same second lock as 01_schema.sql, for the tables that existed before it.
revoke all on public.likes_dislikes, public.fanarts, public.videos, public.stream_slots from anon, authenticated;
