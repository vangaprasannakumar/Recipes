// Bump this any time ASSETS_TO_CACHE or the fetch strategy changes below —
// it's what triggers old caches to be cleaned up on the next activate.
const CACHE_NAME = 'recipe-app-v0.2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// --- INSTALL: precache the app shell, then activate immediately ---
self.addEventListener('install', (event) => {
  self.skipWaiting(); // don't make the user close every tab to get an update
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// --- ACTIVATE: drop old cache versions, take control of open pages ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// --- FETCH: cache-first, then network — and cache whatever the network
// returns so images/thumbnails become available offline too, not just
// the precached app shell. Falls back gracefully if fully offline.
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Never intercept the Apps Script API — always go straight to the network
  if (request.url.includes('script.google.com')) {
    return;
  }

  // Only GET requests are cacheable; let anything else pass through untouched
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          // Cache normal successful responses AND cross-origin "opaque"
          // responses (e.g. recipe/ingredient images) — opaque responses
          // can't be inspected but can still be cached and replayed.
          const isCacheable =
            networkResponse &&
            (networkResponse.ok || networkResponse.type === 'opaque');

          if (isCacheable) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          // Offline and not cached — fail gracefully instead of a hard error
          if (request.destination === 'document') {
            return caches.match('./index.html');
          }
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e2e5ec"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
