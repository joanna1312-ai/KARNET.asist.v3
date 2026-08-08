"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HelpDialog } from "@/components/HelpDialog";

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.44 2.32c-.77.32-1.44.9-1.44 1.68v.5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function HelpMenu() {
  const t = useTranslations("help");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("buttonAria")}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/5 text-foreground hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
      >
        <HelpIcon />
      </button>
      <HelpDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
