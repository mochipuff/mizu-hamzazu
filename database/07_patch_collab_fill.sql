alter table public.collab
  add column if not exists fill_url text constraint collab_fill_url_check check (fill_url ~ '^https://');