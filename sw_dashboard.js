// ══ SERVICE WORKER — BEO Dashboard PWA ══
// Lotus Garden by WH
// Versi: 1.0.0

const CACHE_NAME = 'beo-dashboard-v1';

const PRECACHE = [
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap',
];

// ── Install ──
self.addEventListener('install', event => {
  console.log('[SW Dashboard] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        PRECACHE.map(url => cache.add(url).catch(e => console.warn('[SW Dashboard] Skip:', url, e)))
      )
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: hapus cache lama ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ──
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Bypass: GAS, Firebase, POST
  if (
    url.includes('script.google.com') ||
    url.includes('firebase') ||
    url.includes('googleapis.com/identitytoolkit') ||
    url.includes('tailwindcss.com') ||
    event.request.method !== 'GET'
  ) return;

  // Network First untuk navigasi
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request) || caches.match('/index.html'))
    );
    return;
  }

  // Cache First untuk font Google
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // Default: Network First
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
