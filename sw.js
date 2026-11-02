// sw.js para el Panel de Admin
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDT0lieijjz2sxbu6PqaLmkrQ_HsDadK5M",
  authDomain: "jennyfitapp.firebaseapp.com",
  projectId: "jennyfitapp",
  storageBucket: "jennyfitapp.firebasestorage.app",
  messagingSenderId: "492885885548",
  appId: "1:492885885548:web:64d40ccffe8dad340f4e49"
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Notificación en segundo plano recibida:', payload);
  
  const notificationTitle = payload.notification?.title || 'Jennyfit Admin';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva alerta.',
    icon: 'icono-admin-192.png',
    vibrate: [300, 100, 300, 100, 400]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Al tocar la notificación, abrir el panel
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
