// Firebase Messaging Service Worker
// This handles background push notifications for birthdays, anniversaries, and other alerts

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDyyGAHNJvhuint86USW36eBJKfw_u3AcA",
  authDomain: "curriculum-dbb10.firebaseapp.com",
  projectId: "curriculum-dbb10",
  storageBucket: "curriculum-dbb10.firebasestorage.app",
  messagingSenderId: "706387632109",
  appId: "1:706387632109:web:06c78a304fdbdc12f391e4"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'Avanti Fellows';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: payload.data?.tag || 'default',
    data: payload.data,
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if app is already open
      for (let client of windowClients) {
        if (client.url.includes('curriculum-dbb10') && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Periodic sync for checking birthdays/anniversaries (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-celebrations') {
    event.waitUntil(checkCelebrations());
  }
});

// Check for today's celebrations
async function checkCelebrations() {
  try {
    // This would typically call a backend API to check for today's birthdays/anniversaries
    // For now, we'll store the check in IndexedDB and let the main app handle the actual checking
    console.log('[SW] Checking for celebrations...');
    
    const db = await openDB();
    const lastCheck = await getFromDB(db, 'lastCelebrationCheck');
    const today = new Date().toDateString();
    
    if (lastCheck !== today) {
      await setInDB(db, 'lastCelebrationCheck', today);
      // Trigger a check when the app next opens
      await setInDB(db, 'pendingCelebrationCheck', true);
    }
  } catch (e) {
    console.error('[SW] Celebration check error:', e);
  }
}

// Simple IndexedDB helpers for service worker
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AvantiSW', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data');
      }
    };
  });
}

function getFromDB(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readonly');
    const store = tx.objectStore('data');
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function setInDB(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite');
    const store = tx.objectStore('data');
    const request = store.put(value, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(clients.claim());
});

console.log('[SW] Firebase Messaging Service Worker loaded');
