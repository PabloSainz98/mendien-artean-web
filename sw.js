/* ============================================
   MENDIEN ARTEAN — Service Worker (PWA)
   Estrategia: Cache-first para assets estáticos,
   Network-first para el HTML principal.
   ============================================ */

const CACHE_NAME = 'mendien-artean-v1';

// Assets a cachear en la instalación
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/index.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/i18n.js',
  '/js/main.js',
  '/manifest.json',
  '/images/444547533.jpg',
  '/images/444547567.jpg',
];

// Instalación — pre-cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación — limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — Cache-first para assets, Network-first para navegación
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar peticiones del mismo origen
  if (url.origin !== self.location.origin) return;

  // Network-first para HTML (siempre contenido fresco)
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first para CSS, JS, imágenes, fuentes
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
