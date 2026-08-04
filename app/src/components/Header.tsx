import { getTranslations } from "next-intl/server";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

export async function Header() {
  const t = await getTranslations("header");

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-black/10 px-4 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full bg-accent" />
        <span className="truncate text-base font-bold tracking-tight">{t("brand")}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
