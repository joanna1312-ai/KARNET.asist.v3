import { useTranslations } from "next-intl";
import { CardWarningStatus } from "@/server/card-status";

const STATUS_BADGE_STYLES: Record<CardWarningStatus, string> = {
  ok: "bg-status-ok/15 text-status-ok",
  soon: "bg-status-soon/15 text-status-soon",
  urgent: "bg-status-urgent/15 text-status-urgent",
  "wygasł": "bg-status-urgent/15 text-status-urgent",
  "brak terminu": "bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400",
};

export function StatusBadge({ status }: { status: CardWarningStatus }) {
  const t = useTranslations("cardStatus");
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[status]}`}
    >
      {t(status)}
    </span>
  );
}
