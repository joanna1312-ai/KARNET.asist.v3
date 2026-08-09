"use client";

import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CARD_SURFACE_CLASS } from "@/components/ui/Card";

export function SettingsMenu() {
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("settingsAria")}
        aria-expanded={open}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/5 text-foreground hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
      >
        <Settings className="size-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute right-0 top-[calc(100%+0.5rem)] z-20 w-56 p-3 text-foreground shadow-xl ${CARD_SURFACE_CLASS}`}
        >
          <div>
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("settingsLocaleSection")}
            </p>
            <div className="mt-1.5">
              <LocaleToggle />
            </div>
          </div>
          <div className="mt-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("settingsThemeSection")}
            </p>
            <div className="mt-1.5">
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
