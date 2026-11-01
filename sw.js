// Service Worker para habilitar PWA y recibir notificaciones Push
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDT0lieijjz2sxbu6PqaLmkrQ_HsDadK5M",
    authDomain: "jennyfitapp.firebaseapp.com",
    projectId: "jennyfitapp",
    storageBucket: "jennyfitapp.firebasestorage.app",
    messagingSenderId: "492885885548",
    appId: "1:492885885548:web:64d40ccffe8dad340f4e49"
};

// Inicializamos Firebase en el Service Worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 🚨 DEJAMOS QUE FIREBASE MANEJE LA NOTIFICACIÓN AUTOMÁTICAMENTE
// Al no poner self.registration.showNotification aquí, evitamos que salga doble.
messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Notificación recibida en segundo plano: ', payload);
});

// Evento para abrir la app cuando tocan la notificación
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});

self.addEventListener('install', (event) => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(clients.claim()); });
self.addEventListener('fetch', (event) => { /* Dejar pasar las peticiones */ });
