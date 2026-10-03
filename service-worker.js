// SeiRokom Fashion — Service Worker v8
// Missing files in the old APP_SHELL are intentionally removed.
// Network-first keeps the latest HTML/JS available after deployment.

const CACHE_NAME = "seirokom-cache-v8";
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

/* আগে এই অংশটা ছিল না — তাই index.html-এর "এখনই আপডেট করুন" বাটন চাপলেও
   নতুন Service Worker কখনো সক্রিয় (activate) হতো না, পুরোনো ভার্সনটাই
   সবার জন্য আটকে থাকত। এখন এই মেসেজ পেলে সাথে সাথে নতুন ভার্সন চালু হয়ে
   পেজ রিলোড হবে। */
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  const isNavigation = event.request.mode === "navigate" ||
    (event.request.destination === "document");

  /* HTML পেজের জন্য ব্রাউজারের নিজস্ব HTTP ক্যাশও এড়িয়ে সরাসরি নেটওয়ার্ক
     থেকে আনা হবে, যাতে নতুন আপলোড করা প্রোডাক্ট পেজ সাথে সাথে দেখা যায়। */
  const fetchPromise = isNavigation
    ? fetch(event.request, { cache: "reload" })
    : fetch(event.request);

  event.respondWith(
    fetchPromise.then(response => {
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
