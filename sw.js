// 🔒 SAFE NO-CACHE SERVICE WORKER
self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// ❌ NO fetch handler = NO caching
