const CACHE = 'agencia-ai-v' + Date.now();

self.addEventListener('install', e => {
    e.waitUntil(
          caches.open(CACHE)
            .then(c => c.addAll(['/', '/index.html']))
            .then(() => self.skipWaiting())
        );
});

self.addEventListener('activate', e => {
    e.waitUntil(
          caches.keys().then(keys =>
                  Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
                                 ).then(() => self.clients.claim())
        );
});

self.addEventListener('fetch', e => {
    const isHTML = e.request.mode === 'navigate' ||
          (e.request.headers.get('accept') || '').includes('text/html');
    if (isHTML) {
          e.respondWith(
                  fetch(e.request).then(res => {
                            const clone = res.clone();
                            caches.open(CACHE).then(c => c.put(e.request, clone));
                            return res;
                  }).catch(() => caches.match(e.request))
                );
    } else {
          e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    }
});
