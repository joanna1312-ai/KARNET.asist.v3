"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { applyTheme, readStoredTheme, type Theme } from "@/lib/theme";

const OPTIONS: Theme[] = ["light", "dark", "auto"];

export function AppearanceControl() {
  const t = useTranslations("accountPage");
  // Stan zapisanego motywu istnieje tylko w localStorage, niedostępnym przy SSR — start
  // zawsze od "auto", żeby pierwszy render klienta zgadzał się z HTML-em z serwera
  // (patrz THEME_INIT_SCRIPT/ThemeToggle.tsx), realna wartość doczytuje się w efekcie niżej.
  const [theme, setTheme] = useState<Theme>("auto");

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  useEffect(() => {
    if (theme !== "auto" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("auto");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  function select(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div
      aria-label={t("appearanceLabel")}
      className="flex shrink-0 gap-0.5 rounded-full bg-black/5 p-0.5 dark:bg-white/10"
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => select(option)}
          aria-pressed={theme === option}
          className={`flex min-h-9 items-center justify-center rounded-full px-3 text-[13px] font-semibold ${
            theme === option
              ? "bg-white text-foreground shadow-sm dark:bg-zinc-800"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {t(`appearance${option === "light" ? "Light" : option === "dark" ? "Dark" : "Auto"}`)}
        </button>
      ))}
    </div>
  );
}
