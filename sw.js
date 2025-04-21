const CACHE_NAME = "habitus-cache-v1";
const urlsToCache = [
  "index.html",
  "manifest.json",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png",
  "translations.js",
  "app-translate.js",
  "charts.js",
  "dom.js",
  "app-core.js",
  "pasajes_bilingues.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});