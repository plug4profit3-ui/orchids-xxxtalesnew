// Service Worker for XXX-Tales PWA Push Notifications

const CACHE_NAME = 'xxxtales-v1';

// Install
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle scheduled notification messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { delay, title, body, icon, tag } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: icon || 'https://storage.googleapis.com/foto1982/logo.jpeg',
        badge: 'https://storage.googleapis.com/foto1982/logo.jpeg',
        tag: tag || 'xxxtales-reminder',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        data: { url: self.location.origin }
      });
    }, delay);
  }
});

// Click handler - open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
