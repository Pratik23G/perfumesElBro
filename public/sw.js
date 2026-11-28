// Minimal service worker so Android Chrome offers "Install app" for /admin.
// Network passthrough only: orders and the admin token are never cached.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
