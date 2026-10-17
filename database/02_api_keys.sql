-- 02_api_keys.sql
-- Creates API keys for services that call /api/admin/* (see README, "API keys"). Run after 01_schema.sql.
--
-- A key looks like  mzk_<12 hex>.<64 hex>
--   key id  : the 12 hex digits, public, finds the row
--   secret  : the 64 hex digits (256 random bits), shown once, never stored
--   stored  : a random salt and sha256(salt || secret) as hex. api/index.ts computes the same hash and compares it in constant time.
-- A secret this long is random, not a password, so one salted SHA-256 is enough; a slow hash would only make every request slower.

create extension if not exists pgcrypto with schema extensions;

-- Returns the new key. This is the only time it exists in readable form: copy it into the secret store of the service right away.
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

-- Only the SQL editor (the database owner) may mint keys. The public roles cannot call this through the Data API.
revoke all on function public.create_api_key(text, text[], timestamptz) from public, anon, authenticated;

-- Examples. Permissions are '<resource>:<action>'. Resources: fanarts, videos, schedule, preferences, collab (create, read, update, delete), settings (read, update) and backup (read).
--
-- select public.create_api_key('fan-art-bot', array['fanarts:create', 'fanarts:read']);
-- select public.create_api_key('stream-controller', array['settings:update', 'schedule:create', 'schedule:update', 'schedule:delete'], now() + interval '90 days');
--
-- Take a key out of service (the row stays as a record):
-- update public.api_keys set revoked_at = now() where key_id = '0123456789ab';
--
-- See which keys exist, what they may do and when they were made (never their secrets):
-- select key_id, name, permissions, expires_at, revoked_at, created_at from public.api_keys order by created_at desc;
