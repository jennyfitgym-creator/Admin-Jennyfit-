// Service Worker para habilitar la instalación de la PWA
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Dejamos pasar las peticiones normales. Esto solo autoriza la instalación de la app.
});
