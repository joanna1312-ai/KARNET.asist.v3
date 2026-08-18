"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CARD_SURFACE_CLASS } from "@/components/ui/Card";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
  // Slot dodatkowej treści między opisem a przyciskami — np. checkbox przy
  // silniejszych potwierdzeniach (Sesja V6.10, wyczyszczenie danych karnetów).
  children?: ReactNode;
}

// Generyczny dialog potwierdzenia. Używany do usuwania karnetu — usuwanie nigdy nie
// dzieje się jednym kliknięciem, zawsze przez ten dialog (patrz CLAUDE.md).
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDisabled,
  children,
}: ConfirmDialogProps) {
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
        onCancel();
      }}
      onClose={onCancel}
      onClick={(event) => {
        if (event.target === dialogRef.current) onCancel();
      }}
      className={`m-auto max-h-[min(32rem,calc(100vh-2rem))] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto p-6 text-foreground shadow-xl backdrop:bg-black/40 ${CARD_SURFACE_CLASS}`}
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
      {children}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="button" variant="danger-solid" onClick={onConfirm} disabled={confirmDisabled}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
