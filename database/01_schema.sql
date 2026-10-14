-- 01_schema.sql
-- Tables, indexes, triggers and row level security. Run first, in the Supabase SQL editor of a new, empty database.
-- Every statement is idempotent, so running the file again changes nothing.

-- Keeps updated_at honest on every edit, whether it comes from the Table Editor, the API or another service.
create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- The "Likes" and "Not so much" lists of the Lore section. One row per item, written in every site language.
create table if not exists public.likes_dislikes (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('like', 'dislike')),
  label jsonb not null constraint likes_dislikes_label_check check (label ?& array['en', 'jp', 'id']),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The fan art on the Supports page, newest post first.
create table if not exists public.fanarts (
  id bigint generated always as identity primary key,
  username text not null check (btrim(username) <> '' and username !~ '^@'),
  media_url text not null check (media_url ~ '^https://'),
  posted_at timestamptz not null
);

create index if not exists fanarts_posted_at_idx on public.fanarts (posted_at desc, id desc);

-- The Content page: the newest videos of the YouTube channel. `label` marks a video as a song.
create table if not exists public.videos (
  id text primary key,
  kind text not null check (kind in ('live', 'short', 'vod')),
  label text check (label in ('original', 'cover')),
  title text not null,
  published_at timestamptz not null
);

create index if not exists videos_kind_published_at_idx on public.videos (kind, published_at desc);

-- The stream schedule. Every row is one real date and time, written with its UTC offset.
create table if not exists public.stream_slots (
  id text primary key,
  title text not null,
  description jsonb not null constraint stream_slots_description_check check (description ?& array['en', 'jp', 'id']),
  datetime timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  platform text not null check (platform in ('youtube', 'twitch', 'x', 'discord')),
  members_only boolean not null default false,
  thumbnail_url text
);

create index if not exists stream_slots_datetime_idx on public.stream_slots (datetime);

-- Switches of the site. `guerilla_mode`: the creator streams whenever she can, so the schedule on the page glitches.
create table if not exists public.site_settings (
  key text primary key check (key in ('guerilla_mode')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Keys for services that read and write through the API (see 02_api_keys.sql). Only a salted sha256 of the secret is stored.
create table if not exists public.api_keys (
  id bigint generated always as identity primary key,
  key_id text not null unique check (key_id ~ '^[0-9a-f]{12}$'),
  name text not null check (btrim(name) <> ''),
  salt text not null check (salt ~ '^[0-9a-f]{32}$'),
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  permissions text[] not null check (
    cardinality(permissions) > 0
    and permissions <@ array[
      'fanarts:create', 'fanarts:read', 'fanarts:update', 'fanarts:delete',
      'videos:create', 'videos:read', 'videos:update', 'videos:delete',
      'schedule:create', 'schedule:read', 'schedule:update', 'schedule:delete',
      'preferences:create', 'preferences:read', 'preferences:update', 'preferences:delete',
      'settings:read', 'settings:update'
    ]
  ),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

drop trigger if exists likes_dislikes_updated_at on public.likes_dislikes;
create trigger likes_dislikes_updated_at before update on public.likes_dislikes for each row execute function public.set_updated_at();

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

-- RLS on with no policy: only the secret key (the API) can read or write. The browser never talks to Supabase.
-- The revoke is a second lock: even a policy added by mistake later cannot open these tables to the public roles.
alter table public.likes_dislikes enable row level security;
alter table public.fanarts enable row level security;
alter table public.videos enable row level security;
alter table public.stream_slots enable row level security;
alter table public.site_settings enable row level security;
alter table public.api_keys enable row level security;

revoke all on public.likes_dislikes, public.fanarts, public.videos, public.stream_slots, public.site_settings, public.api_keys from anon, authenticated;
