// ========================================
// CURRICULUM TRACKER - OPTIMIZED SERVICE WORKER
// App Shell Architecture for Instant Loading
// Version: 3.8.1 - Fixed CORS and extension handling
// ========================================

const CACHE_NAME = 'curriculum-tracker-v3.8.1';
const APP_SHELL_CACHE = 'app-shell-v3.8.1';
const DATA_CACHE = 'data-cache-v1';

// ✅ Helper function for safe caching (prevents errors with unsupported schemes)
async function safeCache(cacheName, request, response) {
  try {
    // Only cache http/https requests
    const url = new URL(request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return;
    }
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch (error) {
    console.warn('[SW] Cache put failed:', error.message);
  }
}

// App Shell - These files are cached FIRST and served from cache always
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-manager.js'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Event - Cache App Shell immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v3.8.1');
  
  event.waitUntil(
    Promise.all([
      // Cache App Shell (critical for instant load)
      caches.open(APP_SHELL_CACHE).then((cache) => {
        console.log('[SW] Caching App Shell');
        return cache.addAll(APP_SHELL_FILES);
      }),
      // Cache external resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching external resources');
        return Promise.all(
          EXTERNAL_RESOURCES.map(url => {
            return fetch(url, { mode: 'cors' })
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(err => console.log('[SW] Failed to cache:', url));
          })
        );
      })
    ]).then(() => {
      console.log('[SW] Installation complete - App Shell cached');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v3.8.1');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old version caches
          if (cacheName !== CACHE_NAME && 
              cacheName !== APP_SHELL_CACHE && 
              cacheName !== DATA_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch Event - Serve from cache, then network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // ✅ FIX: Skip chrome-extension, browser-extension, and other unsupported schemes
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' ||
      url.protocol === 'safari-extension:' ||
      url.protocol === 'ms-browser-extension:') {
    return;
  }
  
  // Skip Firebase and API requests (always network)
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('identitytoolkit') ||
      url.hostname.includes('googleapis.com')) {
    return;
  }
  
  // ✅ FIX: Skip Google Drive and other external services that require auth
  if (url.hostname.includes('drive.google.com') ||
      url.hostname.includes('docs.google.com')) {
    return;
  }
  
  // APP SHELL STRATEGY: Cache first, then network
  // This makes the app feel instant - UI loads from cache immediately
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached version immediately
        if (cachedResponse) {
          console.log('[SW] Serving App Shell from cache');
          
          // Update cache in background (stale-while-revalidate)
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              caches.open(APP_SHELL_CACHE).then((cache) => {
                cache.put(event.request, networkResponse);
                console.log('[SW] App Shell cache updated');
              });
            }
          }).catch(() => {});
          
          return cachedResponse;
        }
        
        // No cache - fetch from network
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // STATIC ASSETS: Cache first strategy
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // CDN RESOURCES: Cache first strategy
  if (url.hostname.includes('cdn') || 
      url.hostname.includes('unpkg') || 
      url.hostname.includes('cdnjs') ||
      url.hostname.includes('jsdelivr')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request, { mode: 'cors' }).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // DEFAULT: Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
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

// Background Sync - Queue offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
  if (event.tag === 'sync-curriculum') {
    event.waitUntil(syncCurriculum());
  }
});

// Sync functions
async function syncAttendance() {
  console.log('[SW] Syncing attendance data...');
  // Dispatch event to main app
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_ATTENDANCE' });
  });
}

async function syncCurriculum() {
  console.log('[SW] Syncing curriculum data...');
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_CURRICULUM' });
  });
}

// Message handler - for communication with main app
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

console.log('[SW] Service Worker loaded - App Shell Architecture enabled');
