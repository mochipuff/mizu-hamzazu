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
