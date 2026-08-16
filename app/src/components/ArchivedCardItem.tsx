"use client";

import { useTranslations } from "next-intl";
import { CategoryIcon } from "@/components/CategoryIcon";
import { VisitDots } from "@/components/VisitDots";
import { Button } from "@/components/ui/Button";
import { CardType } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/format";
import type { CardListItemCard } from "@/components/CardListItem";

function isExhausted(card: CardListItemCard): boolean {
  return card.type === CardType.limit && card.totalVisits != null && card.usedVisits >= card.totalVisits;
}

type ArchivedCardItemProps = {
  card: CardListItemCard;
  onRenew: () => void;
};

export function ArchivedCardItem({ card, onRenew }: ArchivedCardItemProps) {
  const t = useTranslations("cardsPage");
  const tDetails = useTranslations("cardDetailsPage");
  const exhausted = isExhausted(card);

  return (
    <li className="flex items-center gap-3 rounded-[20px] bg-black/[.03] p-3.5 dark:bg-white/[.03]">
      <CategoryIcon
        slug={card.company.category.slug}
        color={card.company.category.color}
        size="md"
        className="opacity-50 grayscale"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15.5px] font-semibold text-foreground/70">{card.company.name}</p>
        {exhausted ? (
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <VisitDots
              used={card.usedVisits}
              total={card.totalVisits}
              color={card.company.category.color}
              size="sm"
              muted
            />
            <span className="text-xs text-foreground/50">· {t("archivedExhaustedSuffix")}</span>
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-foreground/50">
            {card.expiryDate ? t("archivedFinishedLabel", { date: formatDate(card.expiryDate) }) : ""}
            {" · "}
            {card.type === CardType.limit && card.totalVisits != null
              ? `${card.usedVisits}/${card.totalVisits}`
              : tDetails("unlimitedLabel")}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={onRenew}
        className="shrink-0 border border-black/10 dark:border-white/15"
      >
        {t("renewButton")}
      </Button>
    </li>
  );
}
