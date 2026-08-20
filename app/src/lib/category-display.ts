import type { CategoryColor } from "@/server/system-categories";

export interface CategoryLike {
  slug: string | null;
  name: string;
  isSystem: boolean;
}

// Kategorie systemowe (Sesja 16) mają stały `slug`, tłumaczony przez istniejący
// słownik i18n `companyCategory` (klucz = slug, np. "gym"). Kategorie użytkownika nie
// mają tłumaczenia — `name` to tekst, który sam wpisał, wyświetlany wprost.
export function categoryDisplayName(
  category: CategoryLike,
  translateSystemSlug: (slug: string) => string
): string {
  return category.isSystem && category.slug
    ? translateSystemSlug(category.slug)
    : category.name;
}

// Klasy Tailwind muszą być statycznymi literałami w źródle, żeby JIT scanner je
// wykrył — stąd mapa zamiast `bg-${color}` w miejscu użycia.
export const CATEGORY_COLOR_CLASS: Record<CategoryColor, string> = {
  mint: "bg-mint",
  coral: "bg-coral",
  accent: "bg-accent",
  sky: "bg-sky",
  violet: "bg-violet",
  slate: "bg-slate",
};

// Warianty tekstowe (Sesja V6.15) — dla miejsc, gdzie kolor kategorii koloruje sam
// tekst/ikonę na tle strony, a nie wypełnienie kształtu. Kolor bazowy każdej kategorii
// ma za mały kontrast na tekst (ok. 2.4–3.2:1 na tle strony) — każdy kolor ma dedykowany
// "-ink" wariant (ciemniejszy w jasnym motywie, jaśniejszy w ciemnym), trzymający
// ≥ 4.5:1 (WCAG AA). accent-deep to wyjątek: już istniejący token, używany tak samo w
// BottomTabBar dla aktywnej zakładki.
export const CATEGORY_TEXT_COLOR_CLASS: Record<CategoryColor, string> = {
  mint: "text-mint-ink",
  coral: "text-coral-ink",
  accent: "text-accent-deep",
  sky: "text-sky-ink",
  violet: "text-violet-ink",
  slate: "text-slate-ink",
};
