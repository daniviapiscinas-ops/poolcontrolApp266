const CACHE_NAME = 'pool-total-control-v1';
const ASSETS = [
  '/poolcontrolApp266/',
  '/poolcontrolApp266/index.html',
  '/poolcontrolApp266/manifest.json',
  '/poolcontrolApp266/icons/icon-192.png',
  '/poolcontrolApp266/icons/icon-512.png'
];

// Instalación — cachear assets principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación — limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — Network first, cache fallback
self.addEventListener('fetch', event => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  // No interceptar peticiones de Firebase (siempre necesitan red)
  const url = event.request.url;
  if (
    url.includes('firebaseapp.com') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('firestore.googleapis.com')
  ) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar copia en cache si la respuesta es válida
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red — devolver desde cache
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/poolcontrolApp266/index.html');
        });
      })
  );
});
