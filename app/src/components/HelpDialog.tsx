"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { CARD_SURFACE_CLASS } from "@/components/ui/Card";

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const SECTION_KEYS = ["addingCard", "visits", "expiryArchive", "account", "companies"] as const;
const FAQ_KEYS = ["paymentsAndBookings", "deleteConfirm", "expiryOptional", "ocr", "mobileApp"] as const;

// Modal z instrukcją obsługi — ten sam wzorzec co ConfirmDialog.tsx (natywny
// <dialog>, zamykanie Escape/klik poza obszarem), ale szerszy i przewijalny.
export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const t = useTranslations("help");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className={`m-auto max-h-[min(38rem,calc(100vh-2rem))] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto p-6 text-foreground shadow-xl backdrop:bg-black/40 ${CARD_SURFACE_CLASS}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-lg font-semibold">
          {t("title")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeAria")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
        >
          <X className="size-4" />
        </button>
      </div>

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {t("guideHeading")}
      </h3>
      <dl className="mt-2 space-y-4">
        {SECTION_KEYS.map((key) => (
          <div key={key}>
            <dt className="text-sm font-semibold">{t(`sections.${key}.title`)}</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t(`sections.${key}.body`)}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {t("faqHeading")}
      </h3>
      <dl className="mt-2 space-y-4">
        {FAQ_KEYS.map((key) => (
          <div key={key}>
            <dt className="text-sm font-semibold">{t(`faq.${key}.question`)}</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t(`faq.${key}.answer`)}
            </dd>
          </div>
        ))}
      </dl>
    </dialog>
  );
}
