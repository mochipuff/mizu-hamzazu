create table if not exists public.collab (
  id bigint generated always as identity primary key,
  name text not null check (btrim(name) <> '' and char_length(name) <= 100),
  avatar_url text check (avatar_url ~ '^https://'),
  link_url text check (link_url ~ '^https://'),
  collab_count integer not null default 1 check (collab_count between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists collab_name_key on public.collab (lower(name));

drop trigger if exists collab_updated_at on public.collab;
create trigger collab_updated_at before update on public.collab for each row execute function public.set_updated_at();

alter table public.collab enable row level security;
revoke all on public.collab from anon, authenticated;

alter table public.api_keys
  drop constraint if exists api_keys_permissions_check,
  add constraint api_keys_permissions_check check (
    cardinality(permissions) > 0
    and permissions <@ array[
      'fanarts:create', 'fanarts:read', 'fanarts:update', 'fanarts:delete',
      'videos:create', 'videos:read', 'videos:update', 'videos:delete',
      'schedule:create', 'schedule:read', 'schedule:update', 'schedule:delete',
      'preferences:create', 'preferences:read', 'preferences:update', 'preferences:delete',
      'settings:read', 'settings:update',
      'collab:create', 'collab:read', 'collab:update', 'collab:delete',
      'backup:read'
    ]
  );
