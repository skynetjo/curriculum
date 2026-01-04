// ========================================
// SERVICE WORKER - Curriculum Tracker PWA
// Enhanced Version with Full PWA Features
// ========================================
// Version - UPDATE THIS WITH EACH DEPLOYMENT
const VERSION = '3.7.3';
const STATIC_CACHE = 'static-v' + VERSION;
const DYNAMIC_CACHE = 'dynamic-v' + VERSION;
const OFFLINE_CACHE = 'offline-v' + VERSION;
const DATA_CACHE = 'data-v' + VERSION;

// ========================================
// CACHE CONFIGURATION
// ========================================
// Files to cache immediately on install (App Shell)
// IMPORTANT: These paths must match your actual files in GitHub!
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Your actual icon files (Capital I, JPG format)
  '/Icon-72.jpg',
  '/Icon-96.jpg',
  '/Icon-144.jpg',
  '/Icon-152.jpg',
  '/Icon-192.jpg',
  '/Icon-384.jpg',
  '/Icon-512.jpg'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// Firebase URLs to never cache
const FIREBASE_URLS = [
  'firebaseio.com',
  'googleapis.com',
  'firebase',
  'firestore'
];

// ========================================
// INSTALL EVENT - Cache App Shell
// ========================================
self.addEventListener('install', event => {
  console.log('[SW] Installing version:', VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache static files (fail gracefully for missing files)
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static files');
        return Promise.all(
          STATIC_FILES.map(url => {
            return cache.add(url).catch(err => {
              console.log('[SW] Failed to cache (skipping):', url);
            });
          })
        );
      }),
      
      // Cache external resources (CDN files)
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('[SW] Caching external resources');
        return Promise.all(
          EXTERNAL_RESOURCES.map(url => {
            return fetch(url, { mode: 'cors' })
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(err => console.log('[SW] Failed to cache external:', url));
          })
        );
      }),
      
      // Create offline page cache
      caches.open(OFFLINE_CACHE).then(cache => {
        return cache.add('/offline.html').catch(() => {
          console.log('[SW] offline.html not found, creating fallback');
        });
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Skip waiting to activate immediately
      self.skipWaiting();
    })
  );
});

// ========================================
// ACTIVATE EVENT - Clean Old Caches
// ========================================
self.addEventListener('activate', event => {
  console.log('[SW] Activating version:', VERSION);
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, OFFLINE_CACHE, DATA_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// ========================================
// FETCH EVENT - Smart Caching Strategy
// ========================================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip Firebase requests - always network
  if (FIREBASE_URLS.some(domain => url.hostname.includes(domain))) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip Freshdesk/chat widgets
  if (url.hostname.includes('freshdesk') || 
      url.hostname.includes('freshchat') ||
      url.hostname.includes('freshworks')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // HTML Navigation - Network First with Offline Fallback
  if (event.request.mode === 'navigate' || 
      url.pathname.endsWith('.html') || 
      url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the latest version
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Try cache first, then offline page
          return caches.match(event.request)
            .then(response => {
              if (response) return response;
              // Return offline page
              return caches.match('/offline.html')
                .then(offlineResponse => {
                  if (offlineResponse) return offlineResponse;
                  // Last resort: return a simple offline response
                  return new Response(
                    '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#1a1a2e;color:#fff;text-align:center}.container{padding:40px}h1{color:#F4B41A;margin-bottom:20px}button{background:#F4B41A;color:#000;border:none;padding:15px 30px;border-radius:10px;font-size:16px;cursor:pointer;margin-top:20px}</style></head><body><div class="container"><h1>📡 You are Offline</h1><p>Please check your internet connection and try again.</p><button onclick="location.reload()">Try Again</button></div></body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
            });
        })
    );
    return;
  }
  
  // API requests - Network First with Cache Fallback
  if (url.pathname.includes('/api/') || url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(DATA_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Static Assets - Cache First with Network Fallback
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cache but also update in background
            fetch(event.request).then(response => {
              if (response.ok) {
                caches.open(DYNAMIC_CACHE).then(cache => {
                  cache.put(event.request, response);
                });
              }
            }).catch(() => {});
            return cachedResponse;
          }
          
          // Not in cache, fetch and cache
          return fetch(event.request).then(response => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }
  
  // Default - Network with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ========================================
// BACKGROUND SYNC - For Offline Data Submission
// ========================================
self.addEventListener('sync', event => {
  console.log('[SW] Background Sync triggered:', event.tag);
  
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
  
  if (event.tag === 'sync-curriculum') {
    event.waitUntil(syncCurriculum());
  }
  
  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncFeedback());
  }
  
  if (event.tag === 'sync-all-data') {
    event.waitUntil(syncAllData());
  }
});

// Sync attendance data when online
async function syncAttendance() {
  try {
    const db = await openIndexedDB();
    const pendingAttendance = await getFromStore(db, 'pendingAttendance');
    
    for (const record of pendingAttendance) {
      try {
        // Send to server (this will be handled by Firebase in main app)
        await self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_ATTENDANCE',
              data: record
            });
          });
        });
        
        // Remove from pending after successful sync
        await removeFromStore(db, 'pendingAttendance', record.id);
        console.log('[SW] Attendance synced:', record.id);
      } catch (err) {
        console.error('[SW] Failed to sync attendance:', err);
      }
    }
    
    // Notify completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', store: 'attendance' });
    });
    
  } catch (err) {
    console.error('[SW] Sync attendance error:', err);
  }
}

// Sync curriculum data when online
async function syncCurriculum() {
  try {
    const db = await openIndexedDB();
    const pendingCurriculum = await getFromStore(db, 'pendingCurriculum');
    
    for (const record of pendingCurriculum) {
      try {
        await self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_CURRICULUM',
              data: record
            });
          });
        });
        
        await removeFromStore(db, 'pendingCurriculum', record.id);
        console.log('[SW] Curriculum synced:', record.id);
      } catch (err) {
        console.error('[SW] Failed to sync curriculum:', err);
      }
    }
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', store: 'curriculum' });
    });
    
  } catch (err) {
    console.error('[SW] Sync curriculum error:', err);
  }
}

// Sync feedback data when online
async function syncFeedback() {
  try {
    const db = await openIndexedDB();
    const pendingFeedback = await getFromStore(db, 'pendingFeedback');
    
    for (const record of pendingFeedback) {
      try {
        await self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_FEEDBACK',
              data: record
            });
          });
        });
        
        await removeFromStore(db, 'pendingFeedback', record.id);
        console.log('[SW] Feedback synced:', record.id);
      } catch (err) {
        console.error('[SW] Failed to sync feedback:', err);
      }
    }
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', store: 'feedback' });
    });
    
  } catch (err) {
    console.error('[SW] Sync feedback error:', err);
  }
}

// Sync all pending data
async function syncAllData() {
  console.log('[SW] Syncing all pending data...');
  await syncAttendance();
  await syncCurriculum();
  await syncFeedback();
  console.log('[SW] All data sync complete');
}

// ========================================
// PERIODIC BACKGROUND SYNC
// For regular data updates in background
// ========================================
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic Sync triggered:', event.tag);
  
  if (event.tag === 'update-curriculum-data') {
    event.waitUntil(updateCurriculumData());
  }
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNotifications());
  }
  
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncAllData());
  }
});

// Fetch latest curriculum data in background
async function updateCurriculumData() {
  try {
    // Notify clients to refresh data
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PERIODIC_SYNC',
        action: 'UPDATE_CURRICULUM'
      });
    });
    console.log('[SW] Periodic curriculum update requested');
  } catch (err) {
    console.error('[SW] Periodic sync failed:', err);
  }
}

// Check for new notifications
async function checkForNotifications() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PERIODIC_SYNC',
        action: 'CHECK_NOTIFICATIONS'
      });
    });
  } catch (err) {
    console.error('[SW] Notification check failed:', err);
  }
}

// ========================================
// PUSH NOTIFICATIONS
// ========================================
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Curriculum Tracker',
    body: 'You have a new notification',
    icon: '/Icon-192.jpg',
    badge: '/Icon-72.jpg',
    tag: 'default',
    data: {}
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/Icon-192.jpg',
    badge: data.badge || '/Icon-72.jpg',
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: 'Open App', icon: '/Icon-192.jpg' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    // For Android
    image: data.image,
    // Renotify if same tag
    renotify: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Default action or 'open' action
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: event.notification.data
            });
            return client.focus();
          }
        }
        // Open new window if not open
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification closed');
  // Track analytics if needed
});

// ========================================
// MESSAGE HANDLING
// Communication with main app
// ========================================
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(names => {
        return Promise.all(names.map(name => caches.delete(name)));
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  // Store data for offline sync
  if (event.data.type === 'STORE_FOR_SYNC') {
    event.waitUntil(
      storeForSync(event.data.store, event.data.data)
    );
  }
  
  // Request background sync
  if (event.data.type === 'REQUEST_SYNC') {
    event.waitUntil(
      self.registration.sync.register(event.data.tag)
    );
  }
});

// ========================================
// INDEXED DB HELPERS
// For storing offline data
// ========================================
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CurriculumTrackerOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores for different data types
      if (!db.objectStoreNames.contains('pendingAttendance')) {
        db.createObjectStore('pendingAttendance', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingCurriculum')) {
        db.createObjectStore('pendingCurriculum', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingFeedback')) {
        db.createObjectStore('pendingFeedback', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingObservations')) {
        db.createObjectStore('pendingObservations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedData')) {
        db.createObjectStore('cachedData', { keyPath: 'key' });
      }
    };
  });
}

function getFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function addToStore(db, storeName, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function storeForSync(storeName, data) {
  try {
    const db = await openIndexedDB();
    await addToStore(db, storeName, {
      ...data,
      id: data.id || Date.now().toString(),
      timestamp: Date.now()
    });
    console.log('[SW] Data stored for sync:', storeName);
  } catch (err) {
    console.error('[SW] Failed to store for sync:', err);
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================
async function showNotification(title, options) {
  if (self.registration.showNotification) {
    return self.registration.showNotification(title, options);
  }
}

// Log service worker status
console.log('[SW] Service Worker loaded - Version:', VERSION);
