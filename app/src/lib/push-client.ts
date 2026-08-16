import { deviceFetch } from "@/lib/device-client";

export type PushSupport = "unsupported" | "supported";

export function getPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  return "serviceWorker" in navigator && "PushManager" in window ? "supported" : "unsupported";
}

// iOS wymaga zainstalowania do ekranu głównego (standalone), żeby push w ogóle działał
// (README.md — ograniczenie platformy, nie tej appki). Wykrywane po media query, którego
// przeglądarka w karcie nigdy nie spełnia.
export function isIosStandaloneRequired(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !isStandalone;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (getPushSupport() === "unsupported") return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

// Rejestruje SW (jeśli jeszcze nie jest), prosi o zgodę na powiadomienia i zapisuje
// subskrypcję na serwerze. Zwraca false bez rzucania wyjątku przy odmowie/błędzie —
// wywołujący (AccountPage) po prostu zostawia przełącznik wyłączony.
export async function subscribeToPush(locale: string): Promise<boolean> {
  if (getPushSupport() === "unsupported") return false;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
  });

  const json = subscription.toJSON();
  const response = await deviceFetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, locale }),
  });

  return response.ok;
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getExistingPushSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await deviceFetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}
