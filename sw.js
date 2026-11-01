// Service Worker para habilitar la instalación de la PWA
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Chrome exige que exista un evento 'fetch', aunque no haga nada
self.addEventListener('fetch', (event) => {
    // Dejamos pasar las peticiones normales.
});
