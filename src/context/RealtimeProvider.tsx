import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n/i18n.ts';
import { parseGuerilla, parseLive, parseSlots, REALTIME_URL, RealtimeContext, type RealtimeState } from './realtime.ts';
import { useSound } from './sound.ts';
import { useToast } from './toast.ts';

/** A hidden tab drops its connection after this long and reconnects when it is shown again, so nobody holds a stream open in the background. */
const HIDDEN_CLOSE_MS = 60_000;

const NOTHING: RealtimeState = { live: null, slots: null, guerilla: null };

/**
 * One Server-Sent Events connection for the whole site (`GET /api/realtime/events` on the Worker).
 * The browser reconnects by itself and the Worker sends the whole current state on every connect,
 * so a dropped connection never leaves the page out of date.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { notify } = useToast();
  const sound = useSound();
  const [state, setState] = useState<RealtimeState>(NOTHING);
  const wasLive = useRef<boolean | null>(null);
  // The connection must outlive a language change or a sound toggle, so the handlers read the latest values from here.
  const latest = useRef({ t, notify, play: sound.play });

  useEffect(() => {
    latest.current = { t, notify, play: sound.play };
  }, [t, notify, sound.play]);

  useEffect(() => {
    if (!REALTIME_URL) return undefined;

    let source: EventSource | null = null;
    let closeTimer: number | undefined;

    const open = () => {
      if (source) return;
      source = new EventSource(`${REALTIME_URL}/api/realtime/events`);

      const listen = (channel: string, apply: (data: unknown) => void) =>
        source?.addEventListener(channel, (event) => {
          try {
            apply(JSON.parse((event as MessageEvent<string>).data));
          } catch {
            /* a message that is not JSON is ignored */
          }
        });

      listen('live:status', (data) => {
        const live = parseLive(data);
        if (!live) return;
        setState((current) => ({ ...current, live }));

        // A toast only for a stream that starts while this page is open, not for one that was already on when it loaded.
        const previous = wasLive.current;
        wasLive.current = live.is_live;
        if (previous === false && live.is_live && !document.hidden) {
          latest.current.notify(latest.current.t.live.nowLiveToast(live.stream_title));
          latest.current.play('sparkle');
        }
      });
      listen('schedule:update', (data) => {
        const slots = parseSlots(data);
        if (slots) setState((current) => ({ ...current, slots }));
      });
      listen('system:guerilla', (data) => {
        const guerilla = parseGuerilla(data);
        if (guerilla) setState((current) => ({ ...current, guerilla }));
      });
    };

    const close = () => {
      source?.close();
      source = null;
    };

    const handleVisibility = () => {
      window.clearTimeout(closeTimer);
      if (document.hidden) closeTimer = window.setTimeout(close, HIDDEN_CLOSE_MS);
      else open();
    };

    open();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearTimeout(closeTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      close();
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <RealtimeContext value={value}>{children}</RealtimeContext>;
}
