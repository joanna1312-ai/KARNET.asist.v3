"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const SECTION_KEYS = ["addingCard", "visits", "expiryArchive", "account", "companies"] as const;
const FAQ_KEYS = ["paymentsAndBookings", "deleteConfirm", "expiryOptional", "ocr", "mobileApp"] as const;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

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
      className="m-auto max-h-[min(38rem,calc(100vh-2rem))] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 text-foreground shadow-xl backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900"
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
          <CloseIcon />
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
