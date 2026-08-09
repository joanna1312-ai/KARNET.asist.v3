import { CATEGORY_COLOR_CLASS } from "@/lib/category-display";
import { categoryIcon } from "@/lib/category-icons";
import type { CategoryColor } from "@/server/system-categories";

type CategoryIconProps = {
  slug: string | null;
  color: CategoryColor;
  className?: string;
};

// Zastępuje dawną samą "kropkę koloru" — to samo kółko z tokenem koloru
// kategorii, plus ikona rozpoznawalna z /brandbook (Sesja V5.2).
export function CategoryIcon({ slug, color, className = "" }: CategoryIconProps) {
  const Icon = categoryIcon(slug);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-white ${CATEGORY_COLOR_CLASS[color]} ${className}`}
    >
      <Icon className="size-3" strokeWidth={2.4} />
    </span>
  );
}
