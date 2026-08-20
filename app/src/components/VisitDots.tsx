import { Infinity as InfinityIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CATEGORY_COLOR_CLASS, CATEGORY_TEXT_COLOR_CLASS } from "@/lib/category-display";
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
  /** Liczba wypełnionych kropek (licząc od końca) odpowiadających wejściom zaplanowanym (data w przyszłości). */
  futureCount?: number;
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
  futureCount = 0,
  className = "",
}: VisitDotsProps) {
  const t = useTranslations("cardDetailsPage");

  if (unlimited || total == null) {
    const iconColorClass = muted ? "text-foreground/50" : CATEGORY_TEXT_COLOR_CLASS[color];
    return (
      <span className={`inline-flex items-center gap-1.5 ${iconColorClass} ${className}`}>
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
          const isPlanned = isFilled && futureCount > 0 && index >= used - futureCount;
          return (
            <span
              key={index}
              className={`${dotSize} shrink-0 rounded-full ${
                isFilled
                  ? `${filledClass} ${isPlanned ? "opacity-[.45]" : ""} ${isLast ? "ring-2 ring-offset-1 ring-accent" : ""}`
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
