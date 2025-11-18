// ========================================
// SERVICE WORKER WITH VERSION MANAGEMENT
// ========================================
// UPDATE THIS VERSION WITH EACH DEPLOYMENT (must match index.html)
const VERSION = '2.4.0';
const CACHE_NAME = `curriculum-tracker-v${VERSION}`;

// Files to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Listen for skip waiting message from main app
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('⏭️ Skipping waiting, activating new service worker immediately');
    self.skipWaiting();
  }
});

// Install event - cache files
self.addEventListener('install', event => {
  console.log(`📦 Service Worker ${VERSION} installing...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📂 Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(`✅ Service Worker ${VERSION} installed successfully`);
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('❌ Cache installation failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log(`🔄 Service Worker ${VERSION} activating...`);
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log(`✅ Service Worker ${VERSION} activated`);
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Firebase and external API requests
  if (
    event.request.url.includes('firebaseapp.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('gstatic.com') ||
    event.request.url.includes('unpkg.com') ||
    event.request.url.includes('cdn.') ||
    event.request.url.includes('tally.so')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          console.error('Fetch failed:', error);
          // You can return a custom offline page here if you have one
        });
      })
  );
});

// Log version on activation
console.log(`📱 Service Worker Version: ${VERSION}`);
