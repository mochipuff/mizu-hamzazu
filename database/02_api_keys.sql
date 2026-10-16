create extension if not exists pgcrypto with schema extensions;

create or replace function public.create_api_key(p_name text, p_permissions text[], p_expires_at timestamptz default null) returns text
language plpgsql
set search_path = ''
as $$
declare
  v_key_id text := encode(extensions.gen_random_bytes(6), 'hex');
  v_secret text := encode(extensions.gen_random_bytes(32), 'hex');
  v_salt text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  insert into public.api_keys (key_id, name, salt, key_hash, permissions, expires_at)
  values (v_key_id, p_name, v_salt, encode(extensions.digest(v_salt || v_secret, 'sha256'), 'hex'), p_permissions, p_expires_at);

  return 'mzk_' || v_key_id || '.' || v_secret;
end;
$$;

revoke all on function public.create_api_key(text, text[], timestamptz) from public, anon, authenticated;