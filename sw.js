// ──────────────────────────────────────────────────────────────────
// WeatherRadar — Service Worker
// Stratégie : Cache-first pour assets statiques,
//             Network-first pour les APIs météo
// ──────────────────────────────────────────────────────────────────

const CACHE_NAME   = 'weatherradar-v11';
const OFFLINE_PAGE = '/';

// Assets à mettre en cache immédiatement à l'installation
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Domaines d'API météo : toujours réseau, jamais cache
const API_ORIGINS = [
  'api.open-meteo.com',
  'air-quality-api.open-meteo.com',
  'geocoding-api.open-meteo.com',
  'marine-api.open-meteo.com',       // Houle, courants, température de l'eau
  'api.rainviewer.com',
  'tilecache.rainviewer.com',
  'nominatim.openstreetmap.org',
  'data.geopf.fr',                   // Géocodage inverse (département, pour la vigilance)
  'public.opendatasoft.com',         // Vigilance Météo-France — donnée de sécurité,
// ne doit JAMAIS être servie depuis un cache obsolète
];

// Bibliothèques JS/CSS versionnées (CDN) : cache-first, comme les polices —
// évite qu'un échec réseau au tout premier chargement hors-ligne renvoie la
// page offline à la place du script (ce qui casserait Leaflet/Chart.js).
const CDN_ORIGINS = [
  'unpkg.com',
  'cdn.jsdelivr.net',
];

// ── Installation : précache des assets statiques ─────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activation : supprime les anciens caches ─────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch : stratégie hybride ────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. APIs météo et tuiles radar → réseau uniquement (pas de cache)
  if (API_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Tuiles OpenStreetMap → Cache-first avec fallback réseau
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          // Cache les tuiles OSM (elles changent rarement)
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME + '-tiles')
              .then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 3. Google Fonts → Cache-first
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 3bis. Bibliothèques CDN versionnées (Leaflet, Chart.js…) → Cache-first
  if (CDN_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 4. Assets locaux (index.html, icônes, manifest) → Cache-first
  //    avec fallback réseau puis page offline
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_PAGE));
    })
  );
});
