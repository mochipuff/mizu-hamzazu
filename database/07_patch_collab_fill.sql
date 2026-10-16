-- 07_patch_collab_fill.sql  [Incremental Patch]
-- Every database, after 01 and 06, any number of times.
--
-- Adds `collab.fill_url`: the picture that fills a partner's card on the Collab page (null = a plain card).
-- A new database already has the column from 01_schema.sql, and then this file changes nothing.
--
-- Run it BEFORE deploying the API that selects `fill_url`: until the column exists, `GET /api/collab/` answers 500.
-- Nothing is rewritten or deleted: existing rows get null, so the page looks the same until a fill is set, for example with
-- PATCH /api/admin/collab/<id> { "fill_url": "https://..." } (the host must be an allowed image host, see IMAGE_HOST in api/index.ts).

-- With IF NOT EXISTS the whole clause, check included, is skipped when the column is already there, so a second run cannot fail on the constraint name.
alter table public.collab
  add column if not exists fill_url text constraint collab_fill_url_check check (fill_url ~ '^https://');
