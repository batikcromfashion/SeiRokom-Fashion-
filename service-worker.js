// SeiRokom Fashion — Service Worker (v6, safe precache)
// এই ফাইলটি এমনভাবে লেখা যাতে কোনো একটা ফাইল না থাকলেও পুরো ইনস্টল ফেইল না করে।

const CACHE_NAME = 'seirokom-cache-v6';

// শুধু এই ফাইলগুলো যেগুলো নিশ্চিতভাবে repo-তে আছে
const CORE_ASSETS = [
  './',
  './index.html'
];

// এই ফাইলগুলো থাকতেও পারে, নাও থাকতে পারে — না থাকলে স্কিপ হয়ে যাবে, এরর দেবে না
const OPTIONAL_ASSETS = [
  './favicon.ico',
  './favicon-32x32.png',
  './favicon-16x16.png',
  './favicon-192x192.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // মূল ফাইলগুলো — এগুলো ফেইল করলে ইনস্টলও ফেইল করবে (এগুলো থাকা আবশ্যক)
      await cache.addAll(CORE_ASSETS);

      // ঐচ্ছিক ফাইলগুলো — একটা একটা করে চেষ্টা করবে, কোনোটা ৪০৪ হলে
      // বা না থাকলে সেটা শুধু স্কিপ হবে, পুরো ইনস্টল আটকাবে না
      await Promise.all(
        OPTIONAL_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            console.warn('[SW] optional asset skipped (not found):', url);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // পুরনো ভার্সনের ক্যাশ মুছে ফেলা
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // শুধু GET রিকোয়েস্ট handle করবে; বাকি সব সরাসরি নেটওয়ার্কে যাবে
  if (req.method !== 'GET') return;

  // ভিন্ন origin (যেমন Firebase, Google Fonts) — সরাসরি নেটওয়ার্কে যাক, ক্যাশে হাত দেব না
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      // Network-first: আগে নেটওয়ার্ক থেকে আনার চেষ্টা, ব্যর্থ হলে ক্যাশ থেকে
      try {
        const fresh = await fetch(req);
        // সফল হলে ক্যাশ আপডেট করে রাখি (পরের বার অফলাইনে কাজে লাগবে)
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch (err) {
        const cached = await caches.match(req);
        if (cached) return cached;

        // পেজ রিকোয়েস্ট হলে অন্তত হোমপেজ দেখাই, একদম ফাঁকা এরর না দেখিয়ে
        if (req.mode === 'navigate') {
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
        }
        throw err;
      }
    })()
  );
});
