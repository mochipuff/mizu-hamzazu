create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.likes_dislikes (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('like', 'dislike')),
  label jsonb not null constraint likes_dislikes_label_check check (label ?& array['en', 'jp', 'id']),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fanarts (
  id bigint generated always as identity primary key,
  username text not null check (btrim(username) <> '' and username !~ '^@'),
  media_url text not null check (media_url ~ '^https://'),
  posted_at timestamptz not null
);

create index if not exists fanarts_posted_at_idx on public.fanarts (posted_at desc, id desc);

create table if not exists public.videos (
  id text primary key,
  kind text not null check (kind in ('live', 'short', 'vod')),
  label text check (label in ('original', 'cover')),
  title text not null,
  published_at timestamptz not null
);

create index if not exists videos_kind_published_at_idx on public.videos (kind, published_at desc);

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

create table if not exists public.site_settings (
  key text primary key check (key in ('guerilla_mode')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

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

alter table public.likes_dislikes enable row level security;
alter table public.fanarts enable row level security;
alter table public.videos enable row level security;
alter table public.stream_slots enable row level security;
alter table public.site_settings enable row level security;
alter table public.api_keys enable row level security;

revoke all on public.likes_dislikes, public.fanarts, public.videos, public.stream_slots, public.site_settings, public.api_keys from anon, authenticated;
