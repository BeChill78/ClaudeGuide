const CACHE_NAME = 'nomade-v2';
const STATIC = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Ne pas cacher les appels API
  if (e.request.url.includes('anthropic.com') ||
      e.request.url.includes('nominatim') ||
      e.request.url.includes('tile.openstreetmap')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
