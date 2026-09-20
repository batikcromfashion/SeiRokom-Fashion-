// SeiRokom Fashion — Service Worker v7
// Missing files in the old APP_SHELL are intentionally removed.
// Network-first keeps the latest HTML/JS available after deployment.

const CACHE_NAME = "seirokom-cache-v7";
const OFFLINE_URL = "./offline.html";
const CORE = ["./", "./index.html", "./manifest.json", "./offline.html"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(CORE.map(url => cache.add(url).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
      }
      return response;
    }).catch(() =>
      caches.match(event.request).then(cached =>
        cached || caches.match(OFFLINE_URL)
      )
    )
  );
});
