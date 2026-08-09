import { Dumbbell, Flower2, Sparkles, Tag, Users, Waves, type LucideIcon } from "lucide-react";
import type { SystemCategorySlug } from "@/server/system-categories";

// Ikony kategorii systemowych — nazewnictwo lucide-react, spójne z paczką ikon
// interfejsu (V5 brand book). Kategorie użytkownika (bez `slug`) dostają
// DEFAULT_CATEGORY_ICON, bo ich nazwa jest dowolnym tekstem.
export const SYSTEM_CATEGORY_ICONS: Record<SystemCategorySlug, LucideIcon> = {
  gym: Dumbbell,
  pool: Waves,
  group_classes: Users,
  massage: Flower2,
  beauty: Sparkles,
};

export const DEFAULT_CATEGORY_ICON: LucideIcon = Tag;

export function categoryIcon(slug: string | null): LucideIcon {
  if (slug && slug in SYSTEM_CATEGORY_ICONS) {
    return SYSTEM_CATEGORY_ICONS[slug as SystemCategorySlug];
  }
  return DEFAULT_CATEGORY_ICON;
}
