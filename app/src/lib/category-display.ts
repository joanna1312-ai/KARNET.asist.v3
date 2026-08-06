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
