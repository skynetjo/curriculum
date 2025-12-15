// ========================================
// FIREBASE MESSAGING SERVICE WORKER
// For Push Notifications - Avanti Help Desk
// ========================================

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase config (same as your project)
// IMPORTANT: Replace with your actual Firebase config
firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages (when browser is closed or tab not focused)
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message received:', payload);
    
    const notificationTitle = payload.notification?.title || 'Avanti Help Desk';
    const notificationOptions = {
        body: payload.notification?.body || 'You have an update on your ticket',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: payload.data?.ticketId || 'helpdesk-notification',
        data: {
            ticketId: payload.data?.ticketId,
            url: payload.data?.url || '/'
        },
        actions: [
            { action: 'view', title: 'View Ticket' },
            { action: 'close', title: 'Dismiss' }
        ],
        vibrate: [200, 100, 200],
        requireInteraction: true
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[FCM SW] Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'view' || !event.action) {
        // Open the app or ticket page
        const urlToOpen = event.notification.data?.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Check if there's already a window open
                    for (const client of clientList) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // If no window is open, open a new one
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

console.log('[FCM SW] Firebase Messaging Service Worker loaded');
