const STATIC_CACHE_NAME = 'athleteos-static-v3';
const RUNTIME_CACHE_NAME = 'athleteos-runtime-v3';
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/AthleteOS_PWAlogo.png', OFFLINE_URL];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then(
        (keys) =>
          Promise.all(
            keys
              .filter((key) => key !== STATIC_CACHE_NAME && key !== RUNTIME_CACHE_NAME)
              .map((key) => caches.delete(key))
          )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (!isSameOrigin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) {
            return cached;
          }
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const copy = response.clone();
          caches.open(RUNTIME_CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
    )
  );
});
