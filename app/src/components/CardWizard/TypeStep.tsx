"use client";

import { CircleDot, Infinity as InfinityIcon, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { CardType } from "@/generated/prisma/enums";
import type { StepProps } from "./types";

const VISIT_PRESETS = [1, 4, 8, 10, 12, 20];

type TypeStepProps = StepProps & { companyName: string; categoryName: string | null };

export function TypeStep({
  values,
  setValues,
  submitting,
  fieldErrors,
  companyName,
  categoryName,
}: TypeStepProps) {
  const t = useTranslations("cardForm");
  const totalVisits = Number(values.totalVisits) || 0;

  function setVisits(next: number) {
    setValues((prev) => ({ ...prev, totalVisits: String(Math.max(1, next)) }));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-brand text-2xl font-extrabold tracking-[-0.02em]">{t("step2Title")}</h1>
        {(companyName || categoryName) && (
          <p className="mt-1 text-sm text-foreground/50">
            {companyName}
            {categoryName ? ` · ${categoryName}` : ""}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(Object.values(CardType) as CardType[]).map((type) => {
          const selected = values.type === type;
          const Icon = type === CardType.limit ? CircleDot : InfinityIcon;
          return (
            <button
              key={type}
              type="button"
              disabled={submitting}
              onClick={() =>
                setValues((prev) => ({
                  ...prev,
                  type,
                  totalVisits: type === CardType.unlimited ? "" : prev.totalVisits || "10",
                }))
              }
              className={`flex flex-col items-start gap-2 rounded-[22px] border p-4 text-left transition-colors ${
                selected
                  ? "border-mint bg-mint/15"
                  : "border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900"
              }`}
            >
              <Icon className={`size-5 ${selected ? "text-mint-ink" : "text-foreground/60"}`} aria-hidden />
              <span className={`font-semibold ${selected ? "text-mint-ink" : "text-foreground"}`}>
                {t(`typeOptions.${type}`)}
              </span>
              <span className="text-xs text-foreground/50">{t("expiryDateHintOptional")}</span>
            </button>
          );
        })}
      </div>
      {fieldErrors.type && <p className="text-sm text-status-urgent">{fieldErrors.type}</p>}

      {values.type === CardType.limit && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">{t("totalVisitsLabel")}</label>
          <div className="flex items-center justify-between rounded-full border border-black/10 px-2 py-1.5 dark:border-white/10">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setVisits(totalVisits - 1)}
              aria-label="-1"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="font-brand text-[26px] font-bold">{values.totalVisits || 0}</span>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setVisits(totalVisits + 1)}
              aria-label="+1"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {VISIT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={submitting}
                onClick={() => setVisits(preset)}
                className={`min-h-9 min-w-9 rounded-full px-3 text-sm font-semibold ${
                  totalVisits === preset
                    ? "bg-foreground text-background"
                    : "bg-black/5 text-foreground/60 dark:bg-white/10"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          {fieldErrors.totalVisits && (
            <p className="text-sm text-status-urgent">{fieldErrors.totalVisits}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold">
          {t("expiryDateLabel")}{" "}
          <span className="font-normal text-foreground/50">— {t("expiryOptionalSuffix")}</span>
        </label>
        <Input
          type="date"
          value={values.expiryDate}
          disabled={submitting}
          className="rounded-full px-4 py-3"
          onChange={(event) => setValues((prev) => ({ ...prev, expiryDate: event.target.value }))}
        />
        {fieldErrors.expiryDate && <p className="text-sm text-status-urgent">{fieldErrors.expiryDate}</p>}
      </div>
    </div>
  );
}
