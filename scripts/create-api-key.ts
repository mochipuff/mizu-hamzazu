import { createHash, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { createClient } from '@supabase/supabase-js';

// npm run key:new -- --name "<service-name>" --scopes "schedule:write,content:write"
// Reads SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local, prints the key once and exits. Keep SCOPES in step with worker/src/auth.ts and the check in the SQL migration.
const SCOPES = ['schedule:write', 'content:write', 'system:write', 'admin'] as const;

const { values } = parseArgs({ options: { name: { type: 'string' }, scopes: { type: 'string' }, 'rate-limit': { type: 'string' } } });

async function ask(question: string, current: string | undefined): Promise<string> {
  if (current) return current;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

const name = await ask('Service name: ', values.name?.trim());
const scopes = (await ask(`Scopes, comma separated (${SCOPES.join(', ')}): `, values.scopes))
  .split(',')
  .map((scope) => scope.trim())
  .filter(Boolean);
const rateLimit = values['rate-limit'] ? Number(values['rate-limit']) : 60;

const unknown = scopes.filter((scope) => !SCOPES.some((known) => known === scope));
if (!name || scopes.length === 0 || unknown.length > 0 || !Number.isInteger(rateLimit) || rateLimit < 1) {
  console.error(unknown.length > 0 ? `Unknown scope: ${unknown.join(', ')}` : 'A name, at least one valid scope and a positive integer --rate-limit are required.');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set (.env.local).');
  process.exit(1);
}

// 192 random bits: the key cannot be guessed, so a plain SHA-256 of it is enough and doubles as the lookup key. The raw key never leaves this process.
const key = `mizu_live_${randomBytes(24).toString('hex')}`;
const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const { error } = await supabase.from('api_keys').insert({
  name,
  key_hash: createHash('sha256').update(key).digest('hex'),
  key_prefix: key.slice(0, 14),
  scopes,
  rate_limit_per_min: rateLimit,
});

if (error) {
  console.error(`Could not store the key: ${error.message}`);
  process.exit(1);
}

console.log(`\nKey for "${name}" (${scopes.join(', ')}). It is shown once and cannot be recovered:\n\n${key}\n`);
