// ══ SERVICE WORKER — BEO Entry PWA ══
// Lotus Garden by WH
// Versi: 1.0.0

const CACHE_NAME = 'beo-entry-v1';

const PRECACHE = [
  '/BEO/entry.html',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap',
];

// ── Install ──
self.addEventListener('install', event => {
  console.log('[SW Entry] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        PRECACHE.map(url => cache.add(url).catch(e => console.warn('[SW Entry] Skip:', url, e)))
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
        .catch(() => caches.match(event.request) || caches.match('/BEO/entry.html'))
    );
    return;
  }

  // Cache First untuk font
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
