// Receives the "Mizu is live" push and opens the stream when the notification is tapped. Kept as plain JS: it is served as-is from /sw.js.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const safeUrl = (value) => {
  try {
    const url = new URL(value, self.location.origin);
    return url.origin === self.location.origin || url.origin === 'https://www.youtube.com' || url.origin === 'https://www.twitch.tv' ? url.href : '/';
  } catch {
    return '/';
  }
};

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* a payload that is not JSON still gets the generic alert */
  }
  const text = (value, fallback, max) => (typeof value === 'string' && value ? value.slice(0, max) : fallback);

  event.waitUntil(
    self.registration.showNotification(text(data.title, 'Mizu is live now!', 100), {
      body: text(data.body, '', 200),
      tag: 'mizu-live',
      renotify: true,
      data: { url: safeUrl(data.url) },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? '/'));
});
