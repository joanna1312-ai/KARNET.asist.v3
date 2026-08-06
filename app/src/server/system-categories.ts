// Sesja 16 — 5 kategorii systemowych (dawny enum CompanyCategory) i paleta kolorów
// kategorii. Stałe `id` (nie generowane), żeby migracja i seed mogły się do nich
// odwoływać deterministycznie i żeby i18n mógł tłumaczyć po `slug`, niezależnie od `id`.
export const SYSTEM_CATEGORY_SLUGS = [
  "gym",
  "pool",
  "group_classes",
  "massage",
  "beauty",
] as const;

export type SystemCategorySlug = (typeof SYSTEM_CATEGORY_SLUGS)[number];

export const SYSTEM_CATEGORY_IDS: Record<SystemCategorySlug, string> = {
  gym: "00000000-0000-0000-0000-000000000001",
  pool: "00000000-0000-0000-0000-000000000002",
  group_classes: "00000000-0000-0000-0000-000000000003",
  massage: "00000000-0000-0000-0000-000000000004",
  beauty: "00000000-0000-0000-0000-000000000005",
};

// Zamknięta paleta kolorów kategorii (decyzja z Sesji 16: wybór z gotowej palety, nie
// dowolny color-picker) — egzekwowana też na poziomie bazy przez enum `category_color`.
export const CATEGORY_COLOR_PALETTE = [
  "mint",
  "coral",
  "accent",
  "sky",
  "violet",
  "slate",
] as const;

export type CategoryColor = (typeof CATEGORY_COLOR_PALETTE)[number];

export const SYSTEM_CATEGORY_SEED: {
  slug: SystemCategorySlug;
  name: string;
  color: CategoryColor;
}[] = [
  { slug: "gym", name: "Siłownia", color: "mint" },
  { slug: "pool", name: "Basen", color: "sky" },
  { slug: "group_classes", name: "Zajęcia grupowe", color: "accent" },
  { slug: "massage", name: "Masaż", color: "violet" },
  { slug: "beauty", name: "Uroda", color: "coral" },
];
