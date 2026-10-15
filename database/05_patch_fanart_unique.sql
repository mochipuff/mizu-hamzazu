-- 05_patch_fanart_unique.sql  [Incremental Patch]
-- Run after 01_schema.sql on any database, new or existing, any number of times.
--
-- Makes `POST /api/admin/fanarts` idempotent: a bot that times out and sends the same fan art again gets `409 Already exists`
-- instead of the art being stored twice.
--
-- Nothing is ever deleted here. If the table already holds the same `media_url` more than once the index is not created and a
-- notice says how many links are duplicated: remove the extra rows in the Table Editor, then run this file again.

do $$
declare
  v_duplicated bigint;
begin
  select count(*) into v_duplicated from (select 1 from public.fanarts group by media_url having count(*) > 1) as d;

  if v_duplicated > 0 then
    raise notice 'fanarts: % media_url value(s) appear more than once. Delete the extra rows, then run this file again.', v_duplicated;
  else
    create unique index if not exists fanarts_media_url_key on public.fanarts (media_url);
  end if;
end;
$$;
