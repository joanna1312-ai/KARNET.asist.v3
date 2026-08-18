import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCallerIdentity, hasIdentity } from "@/server/caller-identity";
import { ownerFilter } from "@/server/card-owner";
import { startOfToday } from "@/server/card-status";
import { formatDateOnly, getPeriodRange, StatsPeriod } from "@/server/stats-rules";
import type { CategoryColor } from "@/server/system-categories";

const categorySelect = {
  id: true,
  slug: true,
  name: true,
  color: true,
  isSystem: true,
} as const;

interface CategoryStat {
  id: string;
  slug: string | null;
  name: string;
  color: CategoryColor;
  isSystem: boolean;
  count: number;
}

interface CompanyStat {
  id: string;
  name: string;
  count: number;
}

// GET /api/stats?period=week|month — raport wejść bieżącej tożsamości (Sesja V6.7).
// Okresy liczone kalendarzowo (pon–niedz / 1.–ostatni dzień miesiąca), nie "ostatnie N
// dni" — ustalone z właścicielką przed sesją, patrz stats-rules.ts. Bierze pod uwagę
// wejścia ze wszystkich karnetów wywołującego (aktywnych i archiwalnych), bez
// rozróżnienia zrealizowane/zaplanowane (inaczej niż realizedVisits z Sesji V6.3) — raport
// pokazuje wszystko, co jest zapisane z datą w danym okresie.
export async function GET(request: Request) {
  const identity = await getCallerIdentity(request);
  if (!hasIdentity(identity)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const periodParam = new URL(request.url).searchParams.get("period") ?? "week";
  if (periodParam !== "week" && periodParam !== "month") {
    return NextResponse.json({ error: "invalid_period" }, { status: 400 });
  }
  const period = periodParam as StatsPeriod;

  const { start, end } = getPeriodRange(period, startOfToday());

  const visits = await prisma.visit.findMany({
    where: {
      visitDate: { gte: start, lt: end },
      card: { deletedAt: null, ...ownerFilter(identity) },
    },
    select: {
      card: {
        select: {
          company: { select: { id: true, name: true, category: { select: categorySelect } } },
        },
      },
    },
  });

  const byCategory = new Map<string, CategoryStat>();
  const byCompany = new Map<string, CompanyStat>();

  for (const visit of visits) {
    const { category, ...company } = visit.card.company;

    const categoryEntry = byCategory.get(category.id);
    if (categoryEntry) {
      categoryEntry.count += 1;
    } else {
      byCategory.set(category.id, { ...category, count: 1 });
    }

    const companyEntry = byCompany.get(company.id);
    if (companyEntry) {
      companyEntry.count += 1;
    } else {
      byCompany.set(company.id, { ...company, count: 1 });
    }
  }

  const topCompany =
    [...byCompany.values()].sort((a, b) => b.count - a.count)[0] ?? null;

  return NextResponse.json({
    period,
    rangeStart: formatDateOnly(start),
    rangeEnd: formatDateOnly(new Date(end.getTime() - 1)),
    totalVisits: visits.length,
    byCategory: [...byCategory.values()].sort((a, b) => b.count - a.count),
    topCompany,
  });
}
