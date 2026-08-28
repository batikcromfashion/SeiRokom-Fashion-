importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCdDiP0NAtmSQt5a8I-DEY8G44rAp4z_-M",
  authDomain: "seirokom-fashion.firebaseapp.com",
  projectId: "seirokom-fashion",
  storageBucket: "seirokom-fashion.firebasestorage.app",
  messagingSenderId: "1051300000338",
  appId: "1:1051300000338:web:27f8dd549b0f222bfc658b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification.title;
  const options = {
    body: payload.notification.body,
    icon: payload.notification.icon || "/icon.png",
    data: { url: payload.data && payload.data.click_url ? payload.data.click_url : "https://batikcromfashion.github.io/SeiRokom-Fashion-/" }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
