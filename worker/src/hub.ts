import { DurableObject } from 'cloudflare:workers';
import type { Channel, ChannelPayloads, Env } from './types.ts';

const HEARTBEAT_MS = 20_000;
const RETRY_MS = 5_000;
const MAX_CLIENTS = 2_000;
const CHANNELS: readonly Channel[] = ['live:status', 'schedule:update', 'system:guerilla'];

const encoder = new TextEncoder();
const frame = (channel: Channel, json: string): Uint8Array => encoder.encode(`event: ${channel}\ndata: ${json}\n\n`);

/** YouTube's quota resets at midnight Pacific time. */
const quotaDay = (now: number): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(now);

/**
 * One instance (`main`) is the single source of truth for the live site: it fans events out to every open SSE
 * connection, keeps the latest message of each channel (strongly consistent, unlike KV) and holds the counters
 * that must not race: who may poll YouTube now, how much quota is spent, how many calls a key made this minute.
 */
export class LiveHub extends DurableObject<Env> {
  #clients = new Set<WritableStreamDefaultWriter<Uint8Array>>();
  #snapshots = new Map<Channel, string>();
  #hits = new Map<string, { count: number; resetAt: number }>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<string>(CHANNELS.map((channel) => `snap:${channel}`));
      for (const channel of CHANNELS) {
        const json = stored.get(`snap:${channel}`);
        if (json) this.#snapshots.set(channel, json);
      }
    });
  }

  /** The SSE connection. A new client first receives the latest message of every channel, then live ones. */
  override async fetch(request: Request): Promise<Response> {
    if (this.#clients.size >= MAX_CLIENTS) return new Response('Too many connections', { status: 503, headers: { 'Retry-After': '30' } });

    const { readable, writable } = new TransformStream<Uint8Array>();
    const writer = writable.getWriter();
    this.#clients.add(writer);
    request.signal.addEventListener('abort', () => this.#drop(writer), { once: true });

    // A channel that has no message yet is skipped.
    const ready = [encoder.encode(`retry: ${RETRY_MS}\n\n`), ...CHANNELS.flatMap((channel) => (this.#snapshots.has(channel) ? [frame(channel, this.#snapshots.get(channel) as string)] : []))];
    void Promise.all(ready.map((chunk) => writer.write(chunk))).catch(() => this.#drop(writer));

    await this.#ensureHeartbeat();
    return new Response(readable);
  }

  /** Stores the new state of a channel and sends it to everyone. Returns false (and sends nothing) when it did not change. */
  async publish<C extends Channel>(channel: C, data: ChannelPayloads[C]): Promise<boolean> {
    const json = JSON.stringify(data);
    if (this.#snapshots.get(channel) === json) return false;
    this.#snapshots.set(channel, json);
    await this.ctx.storage.put(`snap:${channel}`, json);
    this.#broadcast(frame(channel, json));
    return true;
  }

  /** True for exactly one caller per interval, however many ticks race for it. */
  async claim(name: string, minIntervalMs: number): Promise<boolean> {
    const key = `claim:${name}`;
    const now = Date.now();
    if (now - ((await this.ctx.storage.get<number>(key)) ?? 0) < minIntervalMs) return false;
    await this.ctx.storage.put(key, now);
    return true;
  }

  /** Books YouTube quota units for today (Pacific time). False when they would pass the budget; nothing is booked then. */
  async spendQuota(units: number, budget: number): Promise<boolean> {
    const day = quotaDay(Date.now());
    const stored = await this.ctx.storage.get<{ day: string; used: number }>('quota');
    const used = stored?.day === day ? stored.used : 0;
    if (used + units > budget) return false;
    await this.ctx.storage.put('quota', { day, used: used + units });
    return true;
  }

  /** Fixed one-minute window per key. False once `limit` calls were made in the current minute. */
  hit(bucket: string, limit: number): boolean {
    const now = Date.now();
    if (this.#hits.size > 1_000) {
      for (const [key, entry] of this.#hits) if (entry.resetAt <= now) this.#hits.delete(key);
    }
    const entry = this.#hits.get(bucket);
    if (!entry || entry.resetAt <= now) {
      this.#hits.set(bucket, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  }

  /** Small pieces of state that must survive between ticks (the channel id, the alert job). The caller knows the shape. */
  async load(key: string): Promise<unknown> {
    return (await this.ctx.storage.get(`state:${key}`)) ?? null;
  }

  async save(key: string, value: unknown): Promise<void> {
    if (value === null) await this.ctx.storage.delete(`state:${key}`);
    else await this.ctx.storage.put(`state:${key}`, value);
  }

  override async alarm(): Promise<void> {
    this.#broadcast(encoder.encode(': ping\n\n'));
    await this.#ensureHeartbeat();
  }

  #broadcast(chunk: Uint8Array): void {
    for (const writer of this.#clients) writer.write(chunk).catch(() => this.#drop(writer));
  }

  #drop(writer: WritableStreamDefaultWriter<Uint8Array>): void {
    if (!this.#clients.delete(writer)) return;
    writer.close().catch(() => undefined);
  }

  /** Comments keep proxies from closing an idle stream. The alarm only runs while somebody is connected. */
  async #ensureHeartbeat(): Promise<void> {
    if (this.#clients.size === 0 || (await this.ctx.storage.getAlarm()) !== null) return;
    await this.ctx.storage.setAlarm(Date.now() + HEARTBEAT_MS);
  }
}
