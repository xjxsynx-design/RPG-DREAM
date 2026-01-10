const CACHE = 'rpg-dream-C.6d-SINGLE-A-' + '2026-01-10';
const ASSETS = ['./','./index.html','./manifest.json','./sw.js'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => (k!==CACHE)?caches.delete(k):null)) ).then(()=>self.clients.claim())));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(event.request, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
