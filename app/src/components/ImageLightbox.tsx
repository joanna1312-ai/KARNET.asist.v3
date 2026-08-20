"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ImageLightboxProps {
  open: boolean;
  imageUrl: string | null;
  closeAriaLabel: string;
  onClose: () => void;
}

// Pełnoekranowy podgląd zdjęcia vouchera (Sesja V6.12) — ten sam wzorzec co
// ConfirmDialog.tsx/HelpDialog.tsx (natywny <dialog>, zamykanie Escape/klik poza
// obszarem), ale bez ramki karty: samo zdjęcie na ciemnym tle.
export function ImageLightbox({ open, imageUrl, closeAriaLabel, onClose }: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!imageUrl) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] bg-transparent p-4 backdrop:bg-black/85"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={closeAriaLabel}
        className="fixed right-4 top-4 flex size-11 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
      >
        <X className="size-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- podpisany URL Supabase (patrz VoucherFilesPreview) nie jest znaną domeną na build-time */}
      <img
        src={imageUrl}
        alt=""
        className="mx-auto h-full max-h-full w-auto max-w-full object-contain"
      />
    </dialog>
  );
}
