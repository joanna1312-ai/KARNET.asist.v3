// Service worker KARNET.asist (Etap 6, PWA) — świadomie tylko Web Push + kliknięcie
// powiadomienia. Bez cache'owania offline w tej fazie (README.md, PLAN_PRAC.md).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  const { title, body, url, tag } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icon-192",
      badge: "/icon-192",
      data: { url: url || "/cards" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : "/cards";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
