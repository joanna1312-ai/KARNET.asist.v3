import { CATEGORY_COLOR_CLASS } from "@/lib/category-display";
import { categoryIcon } from "@/lib/category-icons";
import type { CategoryColor } from "@/server/system-categories";

const SIZE_STYLES = {
  sm: { wrapper: "size-5", icon: "size-3" },
  md: { wrapper: "size-[34px]", icon: "size-[18px]" },
  lg: { wrapper: "size-11", icon: "size-6" },
} as const;

type CategoryIconProps = {
  slug: string | null;
  color: CategoryColor;
  size?: keyof typeof SIZE_STYLES;
  className?: string;
};

// Zastępuje dawną samą "kropkę koloru" — to samo kółko z tokenem koloru
// kategorii, plus ikona rozpoznawalna z /brandbook (Sesja V5.2).
export function CategoryIcon({ slug, color, size = "sm", className = "" }: CategoryIconProps) {
  const Icon = categoryIcon(slug);
  const { wrapper, icon } = SIZE_STYLES[size];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex ${wrapper} shrink-0 items-center justify-center rounded-full text-white ${CATEGORY_COLOR_CLASS[color]} ${className}`}
    >
      <Icon className={icon} strokeWidth={2.4} />
    </span>
  );
}
