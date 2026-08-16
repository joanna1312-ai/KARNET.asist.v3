"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { deviceFetch } from "@/lib/device-client";
import { formatDate } from "@/lib/format";

type QuickVisitButtonProps = {
  cardId: string;
  companyName: string;
  remainingAfterVisit: number | null;
  onOptimisticVisit: () => void;
  onRollbackVisit: () => void;
  onSaveFailed: () => void;
  onArchived: () => void;
  /** Wywoływane, gdy toast zniknie sam po 5 s, a to wejście wyczerpało limit karnetu. */
  onCardLikelyArchived?: () => void;
};

export function QuickVisitButton({
  cardId,
  companyName,
  remainingAfterVisit,
  onOptimisticVisit,
  onRollbackVisit,
  onSaveFailed,
  onArchived,
  onCardLikelyArchived,
}: QuickVisitButtonProps) {
  const t = useTranslations("toast");
  const [pending, setPending] = useState(false);
  const { showToast } = useToast();

  async function handleClick() {
    if (pending) return;
    setPending(true);
    onOptimisticVisit();

    const todayIso = new Date().toISOString().slice(0, 10);
    const response = await deviceFetch(`/api/cards/${cardId}/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitDate: todayIso, visitTime: null, note: null }),
    });

    setPending(false);

    if (response.status === 409) {
      onRollbackVisit();
      onArchived();
      return;
    }

    if (!response.ok) {
      onRollbackVisit();
      onSaveFailed();
      return;
    }

    const body: { visit: { id: string } } = await response.json();

    showToast({
      title: t("visitSaved", { company: companyName }),
      detail:
        remainingAfterVisit != null
          ? t("visitSavedDetail", { date: formatDate(todayIso), remaining: remainingAfterVisit })
          : formatDate(todayIso),
      undoLabel: t("undo"),
      onUndo: async () => {
        onRollbackVisit();
        await deviceFetch(`/api/cards/${cardId}/visits/${body.visit.id}`, { method: "DELETE" });
      },
      onExpire: remainingAfterVisit === 0 ? onCardLikelyArchived : undefined,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={t("addVisitAria", { company: companyName })}
      className="flex size-12 shrink-0 items-center justify-center rounded-full bg-mint font-bold text-[15px] text-mint-ink transition-opacity disabled:opacity-70"
    >
      {pending ? <Check className="size-5" aria-hidden /> : "+1"}
    </button>
  );
}
