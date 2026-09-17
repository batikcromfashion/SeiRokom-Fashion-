const CACHE_NAME = 'seirokom-fashion-v4';

const APP_SHELL = [
  './',
  './index.html',
  './cart.html',
  './checkout.html',
  './wishlist.html',
  './cart.js',
  './extras.js',
  './product-kids-set.html',
  './product-boys-tshirt.html',
  './product-casual-shirt.html',
  './product-denim-pant.html',
  './product-girls-frock.html',
  './product-kurti.html',
  './product-ladies-3-piece.html',
  './product-polo-tshirt.html',
  './product-saree.html',
  './product-premium-panjabi.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(request);

        if (
          response &&
          response.ok &&
          new URL(request.url).origin === self.location.origin
        ) {
          const responseCopy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseCopy))
            .catch(() => {});
        }

        return response;

      } catch (error) {

        if (request.mode === 'navigate') {
          return (
            await caches.match('./offline.html') ||
            await caches.match('./index.html')
          );
        }

        return new Response('', {
          status: 503,
          statusText: 'Offline'
        });
      }
    })()
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
