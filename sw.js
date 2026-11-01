// Service Worker básico para permitir la instalación de la PWA
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Dejamos pasar todas las peticiones normales. 
    // Esto es solo para que el navegador nos deje instalar la app.
});
