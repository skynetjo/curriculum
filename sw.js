// ========================================
// CURRICULUM TRACKER - SERVICE WORKER
// Version: 3.12.0 - CRITICAL: Fixed button disabling issue
// ========================================

const CACHE_NAME = 'curriculum-tracker-v3.12.0';
const APP_SHELL_CACHE = 'app-shell-v3.12.0';

// App Shell - Only cache our own files, NOT external CDNs
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event - Cache App Shell only
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v3.12.0');
  
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      console.log('[SW] Caching App Shell');
      return cache.addAll(APP_SHELL_FILES).catch(err => {
        console.warn('[SW] Some app shell files failed to cache:', err);
      });
    }).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v3.12.0');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL old caches to ensure clean slate
          if (cacheName !== CACHE_NAME && cacheName !== APP_SHELL_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch Event - Minimal interception to avoid CORS issues
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // ✅ CRITICAL: Skip ALL external domains - let browser handle them normally
  // This prevents CORS issues with CDNs like Tailwind, React, Chart.js, etc.
  if (url.origin !== self.location.origin) {
    return; // Don't intercept - let browser fetch normally
  }
  
  // Skip chrome-extension and other special protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Only handle requests to our own origin
  // APP SHELL: Cache first for index.html
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version, update in background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              caches.open(APP_SHELL_CACHE).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {});
          
          return cachedResponse;
        }
        
        // No cache - fetch from network
        return fetch(event.request).then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      }).catch(() => {
        // Network failed and no cache - return offline page or error
        return new Response('Offline - Please check your connection', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }
  
  // For other same-origin requests: Network first, cache fallback
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
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
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
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});

console.log('[SW] Service Worker v3.12.0 loaded');
