import { Infinity as InfinityIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CATEGORY_COLOR_CLASS } from "@/lib/category-display";
import type { CategoryColor } from "@/server/system-categories";

const WRAP_THRESHOLD = 12;

type VisitDotsProps = {
  used: number;
  total: number | null;
  unlimited?: boolean;
  color: CategoryColor;
  size?: "sm" | "lg";
  highlightLast?: boolean;
  /** Karnet zarchiwizowany — kropki w neutralnej szarości zamiast koloru kategorii. */
  muted?: boolean;
  className?: string;
};

export function VisitDots({
  used,
  total,
  unlimited = false,
  color,
  size = "sm",
  highlightLast = false,
  muted = false,
  className = "",
}: VisitDotsProps) {
  const t = useTranslations("cardDetailsPage");

  if (unlimited || total == null) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-status-urgent ${className}`}>
        <InfinityIcon className={size === "lg" ? "size-6" : "size-4"} aria-hidden />
        <span className="text-sm font-medium">{t("unlimitedLabel")}</span>
      </span>
    );
  }

  const dotSize = size === "lg" ? (total > WRAP_THRESHOLD ? "size-1.5" : "size-[22px]") : "size-2";
  const gap = size === "lg" ? "gap-2.5" : "gap-1";
  const filledClass = muted ? "bg-foreground/30" : CATEGORY_COLOR_CLASS[color];

  return (
    <span
      className={`inline-flex items-center ${size === "lg" ? "gap-3" : "gap-1.5"} ${className}`}
      aria-label={t("limitCounter", { used, total })}
    >
      <span className={`flex flex-wrap items-center ${gap}`} aria-hidden>
        {Array.from({ length: total }, (_, index) => {
          const isFilled = index < used;
          const isLast = highlightLast && index === used - 1;
          return (
            <span
              key={index}
              className={`${dotSize} shrink-0 rounded-full ${
                isFilled
                  ? `${filledClass} ${isLast ? "ring-2 ring-offset-1 ring-accent" : ""}`
                  : size === "lg"
                    ? "border-[1.5px] border-dashed border-black/16 dark:border-white/20"
                    : "bg-black/[.11] dark:bg-white/15"
              }`}
            />
          );
        })}
      </span>
      <span
        className={
          size === "lg"
            ? "text-lg font-medium text-foreground/45"
            : "text-[12.5px] font-semibold text-foreground/62"
        }
      >
        {used}/{total}
      </span>
    </span>
  );
}
