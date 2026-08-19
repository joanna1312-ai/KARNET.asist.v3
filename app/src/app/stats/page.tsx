"use client";

import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Logo } from "@/components/Logo";
import { CARD_SURFACE_CLASS } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { categoryDisplayName } from "@/lib/category-display";
import { deviceFetch } from "@/lib/device-client";
import { formatDate } from "@/lib/format";
import type { CategoryColor } from "@/server/system-categories";

type StatsPeriod = "week" | "month";

interface CategoryStat {
  id: string;
  slug: string | null;
  name: string;
  color: CategoryColor;
  isSystem: boolean;
  count: number;
}

interface StatsResponse {
  period: StatsPeriod;
  rangeStart: string;
  rangeEnd: string;
  totalVisits: number;
  byCategory: CategoryStat[];
  topCompany: { id: string; name: string; count: number } | null;
}

const PERIOD_OPTIONS: StatsPeriod[] = ["week", "month"];

export default function StatsPage() {
  const t = useTranslations("statsPage");
  const tCategory = useTranslations("companyCategory");
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let ignore = false;
    setStats(null);
    setLoadError(false);

    deviceFetch(`/api/stats?period=${period}`)
      .then((response) => {
        if (!response.ok) throw new Error("load_failed");
        return response.json();
      })
      .then((body: StatsResponse) => {
        if (!ignore) setStats(body);
      })
      .catch(() => {
        if (!ignore) setLoadError(true);
      });

    return () => {
      ignore = true;
    };
  }, [period]);

  return (
    <div className="mx-auto w-full max-w-screen-sm px-4 pt-5 pb-6">
      <Logo size="sm" className="mb-1 opacity-60" />
      <h1 className="font-brand text-[27px] leading-[1.15] font-extrabold tracking-[-0.02em]">
        {t("title")}
      </h1>

      <div className="mt-4 flex w-fit gap-1 rounded-full bg-black/5 p-1 dark:bg-white/10">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPeriod(option)}
            className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
              period === option
                ? "bg-foreground text-background"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {t(option === "week" ? "periodWeek" : "periodMonth")}
          </button>
        ))}
      </div>

      {loadError && <p className="mt-4 text-sm text-status-urgent">{t("loadError")}</p>}

      {stats === null && !loadError && (
        <div className="mt-4 flex flex-col gap-3" aria-hidden>
          {[0, 1].map((index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-[20px] bg-black/5 dark:bg-white/5"
            />
          ))}
        </div>
      )}

      {stats !== null && (
        <div className="mt-4 flex flex-col gap-4">
          <section className={`${CARD_SURFACE_CLASS} p-5`}>
            <p className="text-sm text-foreground/60">
              {formatDate(stats.rangeStart)} – {formatDate(stats.rangeEnd)}
            </p>
            <p className="mt-1 text-4xl font-extrabold tracking-[-0.02em]">
              {stats.totalVisits}
            </p>
            <p className="text-sm text-foreground/60">{t("totalVisitsLabel")}</p>
          </section>

          {stats.totalVisits === 0 ? (
            <EmptyState icon={BarChart3}>{t("emptyState")}</EmptyState>
          ) : (
            <>
              <section className={`${CARD_SURFACE_CLASS} p-5`}>
                <h2 className="font-semibold">{t("byCategoryTitle")}</h2>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {stats.byCategory.map((category) => (
                    <li key={category.id} className="flex items-center gap-2.5">
                      <CategoryIcon slug={category.slug} color={category.color} />
                      <span className="flex-1 truncate text-sm">
                        {categoryDisplayName(category, tCategory)}
                      </span>
                      <span className="text-sm font-semibold text-foreground/70">
                        {category.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {stats.topCompany && (
                <section className={`${CARD_SURFACE_CLASS} p-5`}>
                  <h2 className="font-semibold">{t("topCompanyTitle")}</h2>
                  <p className="mt-2 text-sm">
                    {stats.topCompany.name}{" "}
                    <span className="text-foreground/60">
                      · {t("visitsCount", { count: stats.topCompany.count })}
                    </span>
                  </p>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
