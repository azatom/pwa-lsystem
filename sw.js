// dummy sw: self.addEventListener("fetch", (e) =>e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
const version = 'v1.0.4';
const CACHE_NAME = `lsystemcache-${version}`;

const URLS_TO_CACHE = [
  './',
  './192x192.png',
  './lsystem.svg',
  './README.md',
  './favicon.ico',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/marked/16.3.0/lib/marked.umd.js',
];
const base = (() => {
  if (typeof WorkerLocation !== 'undefined' && self.location && self.location.pathname) {
    const swPath = self.location.pathname;
    return swPath.substring(0, swPath.lastIndexOf('/') + 1);
  }
  return './';
})();
const urlAlias = {
  '.': './',
  './index.html': './',
  './lsystem.html': './', 
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
      .catch(err => console.error('Cache installation failed:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

function resolveAlias(fullUrl) {
  let path = new URL(fullUrl).pathname;
  if (path.startsWith(base)) path = './' + path.substring(base.length);
  return urlAlias[path] || path;
};

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;
  const effectivePath = resolveAlias(event.request.url);
  // Create a synthetic request for cache lookup ONLY
  // IMPORTANT: NEVER set mode: 'navigate'
  const cacheLookupRequest = new Request(effectivePath, {
    method: event.request.method,
    headers: event.request.headers,
    // mode: 'same-origin',   // safe default – or omit entirely
    credentials: event.request.credentials,
    cache: event.request.cache,
    redirect: event.request.redirect,
    referrer: event.request.referrer,
    integrity: event.request.integrity,
    // IMPORTANT: Do NOT copy mode if it's 'navigate'
  });
  event.respondWith(
    caches.match(cacheLookupRequest)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fetch from network using the ORIGINAL request
        return fetch(event.request)
          .then(networkResponse => {
            if (
              !networkResponse ||
              networkResponse.status >= 400 ||
              networkResponse.type === 'opaque'
            ) {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              // Cache under ORIGINAL URL
              cache.put(event.request, responseToCache);
              // Also cache under the aliased path (for future alias hits)
              if (effectivePath !== new URL(event.request.url).pathname) {
                cache.put(cacheLookupRequest, responseToCache);
              }
            }).catch(err => console.error('Cache put failed:', err));
            return networkResponse;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return new Response(
                `Offline ${event.request.url}`,
                { headers: { 'Content-Type': 'text/plain' } }
              );
            }
            return new Response('', { status: 503 });
          });
      })
  );
});

self.addEventListener('message', event => {
  try {
    const msg = event.data;
    if (msg && msg.type === 'getVersion') {
      const payload = { version };
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage(payload);
      } else if (event.source && typeof event.source.postMessage === 'function') {
        event.source.postMessage(payload);
      }
    }
  } catch (err) {
    console.error('sw message handler error:', err);
  }
});
