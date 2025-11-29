const CACHE_NAME = "pwa-runtime-cache-v1";

self.addEventListener("install", (event) => {
  // Activate immediately after install.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Clean up old caches and take control of open clients.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only cache GET requests; skip other methods.
  if (request.method !== "GET") {
    return;
  }

  // Network-first with cache fallback for runtime assets.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
