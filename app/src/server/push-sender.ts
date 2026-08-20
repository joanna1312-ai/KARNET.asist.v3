import webpush from "web-push";
import { prisma } from "@/lib/db";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("vapid_not_configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

// Krótkie, samodzielne teksty powiadomienia — poza next-intl celowo: cron nie ma
// kontekstu żądania HTTP, którego next-intl wymaga do getTranslations() (patrz
// server-only helpery w src/i18n). Tylko te dwa krótkie zdania, więc bez sensu
// dociągać cały mechanizm i18n tylko dla tego jednego miejsca.
const REMINDER_TEXT: Record<"pl" | "en", (companyName: string, days: number) => { title: string; body: string }> = {
  pl: (companyName, days) => ({
    title: "KARNET.asist",
    // "dni" poprawne dla obu progów (2 i 7 — polska odmiana liczebników 2–4 i 5+ oba "dni").
    body: `${companyName} — karnet kończy się za ${days} dni.`,
  }),
  en: (companyName, days) => ({
    title: "KARNET.asist",
    body: `${companyName} — your card expires in ${days} day${days === 1 ? "" : "s"}.`,
  }),
};

export interface ReminderTarget {
  cardId: string;
  companyName: string;
  reminderDay: number;
  userId: string | null;
  deviceId: string | null;
}

// Wysyła przypomnienie do wszystkich subskrypcji push właściciela karnetu (konto albo
// urządzenie — ten sam rozdział co reszta appki). Subskrypcje, które przeglądarka
// unieważniła (404/410 z serwera push), są od razu sprzątane z bazy.
export async function sendReminderNotifications(targets: ReminderTarget[]): Promise<{ sent: number; failed: number }> {
  ensureConfigured();

  let sent = 0;
  let failed = 0;

  for (const target of targets) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: target.userId ? { userId: target.userId } : { deviceId: target.deviceId },
    });

    for (const subscription of subscriptions) {
      const locale = subscription.locale === "en" ? "en" : "pl";
      const { title, body } = REMINDER_TEXT[locale](target.companyName, target.reminderDay);

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({ title, body, url: `/cards/${target.cardId}`, tag: `expiry-${target.cardId}` })
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => {});
        }
      }
    }
  }

  return { sent, failed };
}
