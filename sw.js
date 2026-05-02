// 280 Days PWA Service Worker
// Version — bump this to force cache refresh after updates
const CACHE_VERSION = 'v6';
const CACHE_NAME = '280days-' + CACHE_VERSION;

// Files to cache for offline use
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './checkers_receipt_enriched.json',
  './icon-192.png',
  // Google Fonts (cached on first load)
  'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap'
];

// ===== INSTALL: Cache all core assets =====
self.addEventListener('install', function(event) {
  console.log('[SW] Installing 280 Days service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching app shell');
      // Cache what we can, don't fail install if fonts are blocked
      return cache.addAll(ASSETS_TO_CACHE).catch(function(err) {
        console.log('[SW] Some assets failed to cache (probably fonts - OK):', err);
        // Still cache the essentials
        return cache.addAll(['./index.html', './manifest.json']);
      });
    })
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

// ===== ACTIVATE: Clean up old caches =====
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating 280 Days service worker...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) {
            // Delete any old 280days caches that aren't current version
            return name.startsWith('280days-') && name !== CACHE_NAME;
          })
          .map(function(name) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all open pages immediately
  return self.clients.claim();
});

// ===== FETCH: Serve from cache, fall back to network =====
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // Serve from cache, but ALSO update in background (stale-while-revalidate)
        const fetchPromise = fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(function() {
          // Network failed, we already have cache so it's fine
        });
        
        return cachedResponse;
      }

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then(function(networkResponse) {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(function() {
        // Both cache and network failed
        // Return offline fallback page if it's a navigation request
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ===== MESSAGE: Handle cache clear from app =====
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(function() {
      console.log('[SW] Cache cleared on request');
    });
  }
});
