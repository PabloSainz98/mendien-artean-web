/* One-time retirement of the legacy service worker. Never cache API responses. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => /^(mendien|uxarbeiti)/i.test(key)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  );
});
