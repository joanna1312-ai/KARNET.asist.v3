"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { QuickVisitButton } from "@/components/QuickVisitButton";
import { StatusBadge } from "@/components/StatusBadge";
import { VisitDots } from "@/components/VisitDots";
import { Button } from "@/components/ui/Button";
import { CardType } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/format";
import { getCardWarningStatus } from "@/server/card-status";
import type { CategoryColor } from "@/server/system-categories";

export type CardListItemCard = {
  id: string;
  type: CardType;
  totalVisits: number | null;
  usedVisits: number;
  // Wejścia zrealizowane (visitDate <= dziś) — decydują o archiwizacji/statusie
  // ostrzegawczym (Sesja V6.3), niezależnie od surowego usedVisits pokazywanego w liczniku.
  realizedVisits: number;
  expiryDate: string | null;
  company: { id: string; name: string; category: { id: string; slug: string | null; color: CategoryColor } };
};

const EXPIRY_TEXT_CLASS: Record<string, string> = {
  ok: "text-foreground/50",
  soon: "text-status-soon",
  urgent: "text-status-urgent",
  "wygasł": "text-status-urgent",
  "brak terminu": "text-foreground/50",
};

type CardListItemProps = {
  card: CardListItemCard;
  onVisitCountChange: (cardId: string, delta: 1 | -1) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCardLikelyArchived: () => void;
};

export function CardListItem({
  card,
  onVisitCountChange,
  onEdit,
  onDelete,
  onCardLikelyArchived,
}: CardListItemProps) {
  const t = useTranslations("cardsPage");
  const tDetails = useTranslations("cardDetailsPage");
  const tToast = useTranslations("toast");
  const tVisitForm = useTranslations("visitForm");
  const [rowError, setRowError] = useState<string | null>(null);

  const unlimited = card.type !== CardType.limit;
  const remaining = !unlimited && card.totalVisits != null ? card.totalVisits - card.usedVisits : null;
  const status = getCardWarningStatus({
    type: card.type,
    totalVisits: card.totalVisits,
    realizedVisits: card.realizedVisits,
    expiryDate: card.expiryDate ? new Date(card.expiryDate) : null,
  });

  function flashError(message: string) {
    setRowError(message);
    setTimeout(() => setRowError(null), 4000);
  }

  return (
    <li className="flex items-center gap-3 rounded-[20px] border border-black/[.07] bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,.04)] dark:border-white/[.08] dark:bg-zinc-900">
      <Link href={`/cards/${card.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <CategoryIcon slug={card.company.category.slug} color={card.company.category.color} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 truncate text-[15.5px] font-semibold">{card.company.name}</p>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1">
            <VisitDots
              used={card.usedVisits}
              total={card.totalVisits}
              unlimited={unlimited}
              color={card.company.category.color}
              size="sm"
            />
          </p>
          <p className={`mt-0.5 truncate text-xs ${EXPIRY_TEXT_CLASS[status]}`}>
            {remaining != null && remaining > 0 && remaining <= 2 ? `${t("remainingVisitsHint", { count: remaining })} · ` : ""}
            {card.expiryDate
              ? tDetails("expiryLabel", { date: formatDate(card.expiryDate) })
              : tDetails("noExpiryLabel")}
          </p>
          {rowError && <p className="mt-0.5 text-xs text-status-urgent">{rowError}</p>}
        </div>
      </Link>

      <QuickVisitButton
        cardId={card.id}
        companyName={card.company.name}
        remainingAfterVisit={remaining != null ? Math.max(remaining - 1, 0) : null}
        onOptimisticVisit={() => onVisitCountChange(card.id, 1)}
        onRollbackVisit={() => onVisitCountChange(card.id, -1)}
        onSaveFailed={() => flashError(tToast("saveFailed"))}
        onArchived={() => flashError(tVisitForm("errors.cardArchived"))}
        onCardLikelyArchived={onCardLikelyArchived}
      />

      <div className="hidden shrink-0 gap-2 md:flex">
        <Button type="button" variant="ghost" onClick={onEdit}>
          {t("editButton")}
        </Button>
        <Button type="button" variant="danger" onClick={onDelete}>
          {t("deleteButton")}
        </Button>
      </div>
    </li>
  );
}
