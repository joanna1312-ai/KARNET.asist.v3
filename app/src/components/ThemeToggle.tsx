"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

// Ikony 1:1 z prototypu (SUN_ICON / MOON_ICON).
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  );
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
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
