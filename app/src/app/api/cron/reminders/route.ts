import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { filterCardsForReminders } from "@/server/reminders";
import { sendReminderNotifications } from "@/server/push-sender";

// GET /api/cron/reminders — codzienne wywołanie z zewnątrz (Vercel Cron/GitHub Actions,
// patrz .github/workflows/reminders.yml), chronione CRON_SECRET w nagłówku Authorization,
// żeby nikt z zewnątrz nie mógł odpalić masowej wysyłki push na żądanie.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.card.findMany({
    where: { deletedAt: null, expiryDate: { not: null } },
    select: {
      id: true,
      expiryDate: true,
      deletedAt: true,
      userId: true,
      deviceId: true,
      company: { select: { name: true } },
    },
  });

  // Bez jawnego referenceDate — domyślny startOfToday() w reminders.ts liczy od
  // początku dnia, nie od dokładnej chwili wywołania (inaczej zaokrąglenie granicy
  // 7/2 dni gubi się o kilka godzin po północy, patrz reminders.test.ts).
  const targets = filterCardsForReminders(candidates).map((card) => ({
    cardId: card.id,
    companyName: card.company.name,
    reminderDay: card.reminderDay,
    userId: card.userId,
    deviceId: card.deviceId,
  }));

  if (targets.length === 0) {
    return NextResponse.json({ matched: 0, sent: 0, failed: 0 });
  }

  const { sent, failed } = await sendReminderNotifications(targets);

  return NextResponse.json({ matched: targets.length, sent, failed });
}
