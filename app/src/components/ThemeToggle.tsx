"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const t = useTranslations("header");
  // Zainicjowane synchronicznie z atrybutu data-theme, który THEME_INIT_SCRIPT w
  // layout.tsx ustawia przed pierwszym renderem — stąd świadome pominięcie SSR (patrz
  // suppressHydrationWarning niżej: ikona na serwerze zawsze wygląda jak "light").
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("themeAria")}
      suppressHydrationWarning
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/5 text-foreground hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
