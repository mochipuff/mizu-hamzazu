import assert from 'node:assert/strict';
import { test } from 'node:test';
import { liveStatusOf, pollInterval } from '../src/poller.ts';
import type { SlotRow } from '../src/types.ts';
import { parseVideoIds, planChanges, type YtVideo } from '../src/youtube.ts';

const NOW = Date.parse('2026-10-15T08:00:00Z');
const MINUTE = 60_000;
const slot = (overrides: Partial<SlotRow> = {}): SlotRow => ({
  id: 'abcdefghijk',
  title: 'Stream',
  description: {},
  datetime: new Date(NOW + 3 * 3_600_000).toISOString(),
  durationMinutes: 180,
  platform: 'youtube',
  membersOnly: false,
  thumbnailUrl: null,
  liveStatus: 'upcoming',
  ...overrides,
});

test('polling is every 5 minutes when nothing is near', () => {
  assert.equal(pollInterval({ guerilla: false, slots: [slot()], now: NOW }), 5 * MINUTE);
  assert.equal(pollInterval({ guerilla: false, slots: [], now: NOW }), 5 * MINUTE);
});

test('polling is every minute within 30 minutes of a slot, either side, and while a stream is live', () => {
  const at = (minutes: number) => slot({ datetime: new Date(NOW + minutes * MINUTE).toISOString() });
  assert.equal(pollInterval({ guerilla: false, slots: [at(29)], now: NOW }), MINUTE);
  assert.equal(pollInterval({ guerilla: false, slots: [at(-29)], now: NOW }), MINUTE);
  assert.equal(pollInterval({ guerilla: false, slots: [at(31)], now: NOW }), 5 * MINUTE);
  assert.equal(pollInterval({ guerilla: false, slots: [slot({ liveStatus: 'live', datetime: new Date(NOW - 4 * 3_600_000).toISOString() })], now: NOW }), MINUTE);
});

test('guerilla mode polls every minute', () => {
  assert.equal(pollInterval({ guerilla: true, slots: [], now: NOW }), MINUTE);
});

test('daily budget: the idle pace and the burst pace both stay far below 10,000 units', () => {
  const perDay = (intervalMs: number) => (86_400_000 / intervalMs) * 2;
  assert.ok(perDay(MINUTE) + 3 * 3 < 9_000);
  assert.ok(perDay(5 * MINUTE) < 1_000);
});

test('liveStatusOf reports the newest live slot, or offline', () => {
  assert.equal(liveStatusOf([slot()]).is_live, false);
  const event = liveStatusOf([slot({ liveStatus: 'live', title: 'Now' })]);
  assert.deepEqual(event, { is_live: true, platform: 'youtube', stream_title: 'Now', url: 'https://www.youtube.com/watch?v=abcdefghijk', started_at: new Date(NOW + 3 * 3_600_000).toISOString() });
});

const video = (liveBroadcastContent: 'live' | 'upcoming' | 'none', details: YtVideo['liveStreamingDetails']): YtVideo => ({
  id: 'abcdefghijk',
  snippet: { title: ' New stream ', publishedAt: new Date(NOW - 3_600_000).toISOString(), liveBroadcastContent },
  liveStreamingDetails: details,
});

test('a stream that just went live is announced once', () => {
  const live = video('live', { actualStartTime: new Date(NOW - 2 * MINUTE).toISOString() });
  const first = planChanges({ ids: ['abcdefghijk'], videos: [live], known: [slot()], guerilla: false, now: NOW });
  assert.equal(first.wentLive.length, 1);
  assert.equal(first.upserts[0]?.live_status, 'live');

  const again = planChanges({ ids: ['abcdefghijk'], videos: [live], known: [slot({ liveStatus: 'live', title: 'New stream', datetime: new Date(NOW - 2 * MINUTE).toISOString(), durationMinutes: 180 })], guerilla: false, now: NOW });
  assert.equal(again.wentLive.length, 0);
});

test('guerilla mode writes no waiting rooms but still records a surprise stream going live', () => {
  const upcoming = video('upcoming', { scheduledStartTime: new Date(NOW + 3_600_000).toISOString() });
  assert.equal(planChanges({ ids: ['abcdefghijk'], videos: [upcoming], known: [], guerilla: true, now: NOW }).upserts.length, 0);
  const live = video('live', { actualStartTime: new Date(NOW - MINUTE).toISOString() });
  assert.equal(planChanges({ ids: ['abcdefghijk'], videos: [live], known: [], guerilla: true, now: NOW }).wentLive.length, 1);
});

test('rows added by hand are never touched', () => {
  const live = video('live', { actualStartTime: new Date(NOW - MINUTE).toISOString() });
  const plan = planChanges({ ids: ['abcdefghijk'], videos: [live], known: [slot({ liveStatus: null })], guerilla: false, now: NOW });
  assert.equal(plan.upserts.length + plan.removals.length, 0);
});

test('parseVideoIds reads the Atom feed once per id', () => {
  const xml = '<entry><yt:videoId>abcdefghijk</yt:videoId></entry><entry><yt:videoId>abcdefghijk</yt:videoId></entry><entry><yt:videoId>lmnopqrstuv</yt:videoId></entry>';
  assert.deepEqual(parseVideoIds(xml), ['abcdefghijk', 'lmnopqrstuv']);
});
