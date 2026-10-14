-- v1.0.0-live: M2M API keys, push subscriptions, system config (guerilla mode), live status on slots,
-- and the sliding window (12 per bucket) that rebalances itself whenever `videos` changes.
-- Idempotent: safe to run again on a database that already has parts of it.

create extension if not exists pgcrypto with schema extensions;

-- Used by the triggers below. Redefining it is harmless.
create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- API keys
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_hash text not null unique,        -- SHA-256 (hex) of the secret token; the token itself is never stored
  key_prefix text not null,             -- first 14 chars, to recognise a key ("mizu_live_7a1b")
  scopes text[] not null default '{}',  -- schedule:write, content:write, system:write, admin
  is_active boolean not null default true,
  rate_limit_per_min integer not null default 60 check (rate_limit_per_min > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.api_keys drop constraint if exists api_keys_scopes_valid;
alter table public.api_keys
  add constraint api_keys_scopes_valid
  check (scopes <@ array['schedule:write', 'content:write', 'system:write', 'admin']::text[]);

drop trigger if exists api_keys_updated_at on public.api_keys;
create trigger api_keys_updated_at before update on public.api_keys for each row execute function public.set_updated_at();

alter table public.api_keys enable row level security;
-- No policy on purpose: only the service role (the Worker, the CLI) can touch this table.

-- Callable from the Supabase SQL editor: select public.generate_api_key('my-bot', array['schedule:write']);
-- The raw key is returned once and cannot be recovered afterwards.
create or replace function public.generate_api_key(p_name text, p_scopes text[] default '{}') returns text
language plpgsql
set search_path = ''
as $$
declare
  v_raw text := 'mizu_live_' || encode(extensions.gen_random_bytes(24), 'hex');
begin
  insert into public.api_keys (name, key_hash, key_prefix, scopes)
  values (btrim(p_name), encode(extensions.digest(v_raw, 'sha256'), 'hex'), left(v_raw, 14), coalesce(p_scopes, '{}'));
  return v_raw;
end;
$$;

-- Supabase exposes every public function to the anon role through /rest/v1/rpc. These must stay closed.
revoke all on function public.generate_api_key(text, text[]) from public, anon, authenticated;
grant execute on function public.generate_api_key(text, text[]) to service_role;

-- ---------------------------------------------------------------- Web Push
create table if not exists public.push_subscriptions (
  endpoint text primary key check (endpoint ~ '^https://' and length(endpoint) <= 2048),
  p256dh text not null check (length(p256dh) <= 256),
  auth text not null check (length(auth) <= 64),
  locale text not null default 'en' check (locale in ('en', 'jp', 'id', 'kr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists push_subscriptions_updated_at on public.push_subscriptions;
create trigger push_subscriptions_updated_at before update on public.push_subscriptions for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;

-- ---------------------------------------------------------------- System config
create table if not exists public.system_configs (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists system_configs_updated_at on public.system_configs;
create trigger system_configs_updated_at before update on public.system_configs for each row execute function public.set_updated_at();

alter table public.system_configs enable row level security;

insert into public.system_configs (key, value) values
  ('guerilla_mode', '{"active": false, "message": ""}'),
  ('video_backfill', '{"requested": false}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- Live status on slots
-- null = a row added by hand: the Worker never touches it.
alter table public.stream_slots add column if not exists live_status text;
alter table public.stream_slots drop constraint if exists stream_slots_live_status_check;
alter table public.stream_slots add constraint stream_slots_live_status_check check (live_status in ('upcoming', 'live', 'ended'));

-- ---------------------------------------------------------------- Sliding window
-- Buckets: live, short, vod, song. A video labelled original/cover is a song whatever its kind. 12 per bucket, newest first.
create or replace function public.prune_videos() returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  perform set_config('mizu.rebalancing', 'on', true);
  with ranked as (
    select id, row_number() over (partition by (case when label is not null then 'song' else kind end) order by published_at desc, id desc) as rank
    from public.videos
  )
  delete from public.videos v using ranked r where v.id = r.id and r.rank > 12;
  get diagnostics v_deleted = row_count;
  perform set_config('mizu.rebalancing', 'off', true);
  return v_deleted;
end;
$$;

-- Runs after every statement that changes `videos` (Table Editor edits included).
-- Prunes the overflow, then asks the Worker to backfill from YouTube when a bucket that YouTube can fill ran short.
create or replace function public.videos_rebalance() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('mizu.rebalancing', true) = 'on' then
    return null;
  end if;

  perform public.prune_videos();

  if current_setting('mizu.ingesting', true) is distinct from 'on'
     and exists (
       select 1
       from (values ('live'), ('short'), ('vod')) as b(bucket)
       where (select count(*) from public.videos where label is null and kind = b.bucket) < 12
     ) then
    insert into public.system_configs (key, value) values ('video_backfill', jsonb_build_object('requested', true, 'at', now()))
    on conflict (key) do update set value = excluded.value;
  end if;

  return null;
end;
$$;

drop trigger if exists videos_rebalance_insert on public.videos;
create trigger videos_rebalance_insert after insert on public.videos for each statement execute function public.videos_rebalance();
drop trigger if exists videos_rebalance_update on public.videos;
create trigger videos_rebalance_update after update on public.videos for each statement execute function public.videos_rebalance();
drop trigger if exists videos_rebalance_delete on public.videos;
create trigger videos_rebalance_delete after delete on public.videos for each statement execute function public.videos_rebalance();

-- The Worker's way in: inserts only videos the table does not have yet (a hand-edited kind or label stays), the trigger prunes.
create or replace function public.ingest_videos(p_rows jsonb) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  perform set_config('mizu.ingesting', 'on', true);
  insert into public.videos (id, kind, title, published_at)
  select r.id, r.kind, r.title, r.published_at
  from jsonb_to_recordset(p_rows) as r(id text, kind text, title text, published_at timestamptz)
  on conflict (id) do nothing;
  get diagnostics v_inserted = row_count;
  perform set_config('mizu.ingesting', 'off', true);
  return v_inserted;
end;
$$;

revoke all on function public.prune_videos() from public, anon, authenticated;
revoke all on function public.videos_rebalance() from public, anon, authenticated;
revoke all on function public.ingest_videos(jsonb) from public, anon, authenticated;
grant execute on function public.prune_videos() to service_role;
grant execute on function public.ingest_videos(jsonb) to service_role;
