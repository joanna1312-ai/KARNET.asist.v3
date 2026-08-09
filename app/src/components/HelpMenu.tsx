"use client";

import { CircleHelp } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { HelpDialog } from "@/components/HelpDialog";

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
        <CircleHelp className="size-4" />
      </button>
      <HelpDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
