// YapWise AI Service Worker - Daily Practice & Roadmap Notifications
const CACHE_NAME = 'yapwise-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming messages from the frontend React app
self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'SHOW_NOTIFICATION') {
    const title = data.title || 'YapWise AI Daily Drill 🚀';
    const options = {
      body: data.body || 'Time for your daily English & interview speech practice!',
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      tag: data.tag || 'yapwise-reminder',
      renotify: true,
      requireInteraction: false,
      data: {
        url: data.url || '/speaking'
      }
    };
    self.registration.showNotification(title, options);
  }

  if (data.type === 'SCHEDULE_REMINDER') {
    const delay = Math.max(1000, data.delayMs || 5000);
    setTimeout(() => {
      self.registration.showNotification(data.title || 'YapWise Practice Alert', {
        body: data.body || 'Your scheduled speech practice session is starting now.',
        icon: '/favicon.ico',
        tag: 'yapwise-scheduled',
        renotify: true,
        data: { url: '/speaking' }
      });
    }, delay);
  }
});

// Handle notification click: focus existing window or open new tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/speaking';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Background Push listener (for WebPush / VAPID integration)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'YapWise AI Practice Alert 🎯',
    body: 'Daily voice practice reminder is ready.',
    url: '/speaking'
  };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: payload.url || '/speaking' }
    })
  );
});
