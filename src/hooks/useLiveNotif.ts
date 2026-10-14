import { useCallback, useEffect, useState } from 'react';
import { REALTIME_URL } from '../context/realtime.ts';
import { useSound } from '../context/sound.ts';
import { useToast } from '../context/toast.ts';
import { useI18n } from '../i18n/i18n.ts';

const STORAGE_KEY = 'mizu:live_notif';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

const readStored = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
};

const store = (on: boolean): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* storage is unavailable; the choice simply won't persist */
  }
};

function toKey(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

const canPush = (): boolean => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function post(method: 'POST' | 'DELETE', body: unknown): Promise<void> {
  const response = await fetch(`${REALTIME_URL}/api/notifications/subscribe`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Subscription request failed: ${response.status}`);
}

/** The "Live notif" switch: browser permission, push subscription (VAPID) and the saved choice (`mizu:live_notif`). */
export function useLiveNotif() {
  const { t, locale } = useI18n();
  const { notify } = useToast();
  const sound = useSound();
  const configured = Boolean(REALTIME_URL && VAPID_PUBLIC_KEY);
  const [enabled, setEnabled] = useState(() => configured && readStored() && canPush() && Notification.permission === 'granted');
  const [busy, setBusy] = useState(false);

  // Keeps the stored language right after a language change, and renews a subscription the browser replaced.
  useEffect(() => {
    if (!enabled) return;
    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => (subscription ? post('POST', { ...subscription.toJSON(), locale }) : undefined))
      .catch(() => undefined);
  }, [enabled, locale]);

  const toggle = useCallback(async () => {
    if (busy) return;
    if (!canPush()) {
      notify(t.live.notifUnsupported);
      return;
    }

    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      if (enabled) {
        if (existing) {
          await post('DELETE', { endpoint: existing.endpoint }).catch(() => undefined);
          await existing.unsubscribe();
        }
        store(false);
        setEnabled(false);
        sound.play('pop');
        notify(t.live.notifDisabled);
        return;
      }

      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (permission !== 'granted') {
        notify(permission === 'denied' ? t.live.notifBlocked : t.live.notifDismissed);
        return;
      }

      const subscription = existing ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_PUBLIC_KEY ?? '') }));
      try {
        await post('POST', { ...subscription.toJSON(), locale });
      } catch (error) {
        // A subscription the server never heard of would only be a dead end.
        if (!existing) await subscription.unsubscribe();
        throw error;
      }
      store(true);
      setEnabled(true);
      sound.play('bloop');
      notify(t.live.notifEnabled);
    } catch {
      notify(t.live.notifFailed);
    } finally {
      setBusy(false);
    }
  }, [busy, enabled, locale, notify, sound, t]);

  return { configured, enabled, busy, toggle };
}
