// ========================================
// CURRICULUM TRACKER - SERVICE WORKER
// Version: 5.5.2 - Version Sync + Performance
// ========================================

const CACHE_NAME = 'curriculum-tracker-v5.5.2';
const APP_SHELL_CACHE = 'app-shell-v5.5.2';

// App Shell - Only cache our own files, NOT external CDNs
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event - Cache App Shell only
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v5.5.2');
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_FILES).catch(err => {
        console.warn('[SW] Some files failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v5.5.2');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== APP_SHELL_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Minimal interception to avoid CORS issues
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // ✅ CRITICAL: Skip ALL external domains - prevents CORS issues with CDNs
  if (url.origin !== self.location.origin) return;

  // Skip non-http protocols
  if (!url.protocol.startsWith('http')) return;

  // APP SHELL: Cache-first for index.html
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached, update in background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              caches.open(APP_SHELL_CACHE).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      }).catch(() => new Response('Offline - Please check your connection', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      }))
    );
    return;
  }

  // All other same-origin: Network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance' || event.tag === 'sync-curriculum') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_' + event.tag.toUpperCase() });
        });
      })
    );
  }
});

// Message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => caches.delete(cacheName));
    });
  }
});

console.log('[SW] Service Worker v5.5.2 loaded');
