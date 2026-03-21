// ══ SERVICE WORKER — Check Venue PWA ══
// Lotus Garden by WH
// Versi: 1.0.0

const CACHE_NAME = 'check-venue-v1';

// File yang di-cache saat install (app shell)
const PRECACHE = [
  '/BEO-Lotus-Garden-Hotel/venue',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
];

// ── Install: precache app shell ──
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache satu per satu agar satu gagal tidak block semua
      return Promise.allSettled(
        PRECACHE.map(url => cache.add(url).catch(e => console.warn('[SW] Skip cache:', url, e)))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: hapus cache lama ──
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Network First untuk API, Cache First untuk aset statis ──
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Selalu ke network untuk:
  // 1. Google Apps Script (data live)
  // 2. Firebase Auth
  // 3. Request POST
  if (
    url.includes('script.google.com') ||
    url.includes('firebase') ||
    url.includes('googleapis.com/identitytoolkit') ||
    event.request.method !== 'GET'
  ) {
    return; // biarkan browser handle langsung
  }

  // Network First untuk halaman HTML utama
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          // Update cache dengan versi terbaru
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => {
          // Offline fallback — sajikan dari cache
          return caches.match(event.request)
            || caches.match('/BEO/venue');
        })
    );
    return;
  }

  // Cache First untuk font Google & aset statis lain
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
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
