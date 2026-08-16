"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Plus, Sparkles, Ticket, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

const LEADING_TABS = [
  { href: "/cards", key: "cards", icon: Ticket },
  { href: "/companies", key: "companies", icon: Building2 },
] as const;

const TRAILING_TABS = [
  { href: "/recommendations", key: "recommendations", icon: Sparkles },
  { href: "/account", key: "account", icon: UserRound },
] as const;

function TabLink({ href, label, icon: Icon, isActive }: { href: string; label: string; icon: typeof Ticket; isActive: boolean }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 ${
        isActive ? "font-semibold text-accent-deep" : "text-foreground/45"
      }`}
    >
      <Icon className="size-[22px]" aria-hidden />
      <span className="text-[11px]">{label}</span>
    </Link>
  );
}

export function BottomTabBar() {
  const t = useTranslations("tabs");
  const pathname = usePathname();

  // Wariant 1b (FAB centralny) — przycisk "Dodaj karnet" zastępuje pozycję w środku
  // paska, ale tylko na samej liście karnetów (nie w jej szczegółach/archiwum-podekranach).
  const showFab = pathname === "/cards";

  return (
    <nav
      aria-label={t("navAria")}
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-black/10 bg-background/92 pt-2 backdrop-blur-md md:hidden dark:border-white/10"
      style={{ paddingBottom: "calc(30px + env(safe-area-inset-bottom))" }}
    >
      {LEADING_TABS.map(({ href, key, icon }) => (
        <TabLink
          key={href}
          href={href}
          label={t(key)}
          icon={icon}
          isActive={pathname === href || pathname.startsWith(`${href}/`)}
        />
      ))}

      {showFab && (
        <div className="flex flex-1 items-center justify-center">
          <Link
            href="/cards/new"
            aria-label={t("addCardAria")}
            className="flex size-14 -translate-y-3.5 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_20px_rgba(242,130,90,0.4)]"
          >
            <Plus className="size-6" aria-hidden />
          </Link>
        </div>
      )}

      {TRAILING_TABS.map(({ href, key, icon }) => (
        <TabLink
          key={href}
          href={href}
          label={t(key)}
          icon={icon}
          isActive={pathname === href || pathname.startsWith(`${href}/`)}
        />
      ))}
    </nav>
  );
}
