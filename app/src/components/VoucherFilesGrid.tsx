"use client";

import { FileText, Plus, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import type { VoucherFile } from "@/lib/voucher-upload";

// Siatka miniaturek plików/zdjęć vouchera (Sesja V6.2) — zastępuje pojedynczy input pliku
// z Sesji V4.3/ADR-009. Współdzielona przez CardForm.tsx, CardWizard/VoucherStep.tsx i
// cards/[id]/page.tsx, żeby logika limitu/podglądu/usuwania żyła w jednym miejscu.
//
// Usuwanie i dodawanie jest ODROCZONE do zapisu formularza (ten sam wzorzec co dawne
// `voucherFile`/`voucherRemoveFile`) — `existingFiles`/`filesToRemove`/`newFiles` to tylko
// stan w pamięci, żadne wywołanie API nie idzie stąd bezpośrednio.
interface VoucherFilesGridProps {
  existingFiles: VoucherFile[];
  filesToRemove: string[];
  newFiles: File[];
  onToggleRemoveExisting: (id: string) => void;
  onAddFile: (file: File) => void;
  onRemoveNewFile: (index: number) => void;
  disabled: boolean;
  maxCount: number;
  accept: string;
  error?: string;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function NewFileThumb({
  file,
  onRemove,
  disabled,
  removeAria,
}: {
  file: File;
  onRemove: () => void;
  disabled: boolean;
  removeAria: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImageFile(file)) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- lokalny podgląd z object URL, nie zdalny zasób
        <img src={previewUrl} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 bg-black/5 dark:bg-white/5">
          <FileText className="size-6 text-foreground/50" />
        </div>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={removeAria}
        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function ExistingFileThumb({
  file,
  markedForRemoval,
  onToggleRemove,
  disabled,
  removeAria,
  undoRemoveAria,
}: {
  file: VoucherFile;
  markedForRemoval: boolean;
  onToggleRemove: () => void;
  disabled: boolean;
  removeAria: string;
  undoRemoveAria: string;
}) {
  return (
    <div
      className={`relative size-20 shrink-0 overflow-hidden rounded-lg border border-black/10 dark:border-white/10 ${
        markedForRemoval ? "opacity-40" : ""
      }`}
    >
      {file.kind === "pdf" ? (
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="flex size-full flex-col items-center justify-center gap-1 bg-black/5 dark:bg-white/5"
        >
          <FileText className="size-6 text-foreground/50" />
        </a>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- podpisany URL Supabase Storage, nie lokalny zasób Next
        <img src={file.url} alt="" className="size-full object-cover" />
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleRemove}
        aria-label={markedForRemoval ? undoRemoveAria : removeAria}
        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
      >
        {markedForRemoval ? <RotateCcw className="size-3" /> : <X className="size-3" />}
      </button>
    </div>
  );
}

export function VoucherFilesGrid({
  existingFiles,
  filesToRemove,
  newFiles,
  onToggleRemoveExisting,
  onAddFile,
  onRemoveNewFile,
  disabled,
  maxCount,
  accept,
  error,
}: VoucherFilesGridProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("cardForm");

  const liveCount =
    existingFiles.length - filesToRemove.length + newFiles.length;
  const atLimit = liveCount >= maxCount;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {existingFiles.map((file) => (
          <ExistingFileThumb
            key={file.id}
            file={file}
            markedForRemoval={filesToRemove.includes(file.id)}
            onToggleRemove={() => onToggleRemoveExisting(file.id)}
            disabled={disabled}
            removeAria={t("voucherFilesRemoveAria")}
            undoRemoveAria={t("voucherFilesUndoRemoveAria")}
          />
        ))}
        {newFiles.map((file, index) => (
          <NewFileThumb
            key={`${file.name}-${index}`}
            file={file}
            onRemove={() => onRemoveNewFile(index)}
            disabled={disabled}
            removeAria={t("voucherFilesRemoveAria")}
          />
        ))}
        {!atLimit && (
          <>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={accept}
              // capture="environment" — na telefonie otwiera od razu aparat tylny (README,
              // PWA scope); przeglądarki desktopowe ten atrybut po prostu ignorują.
              capture="environment"
              disabled={disabled}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onAddFile(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              aria-label={t("voucherFilesAddAria")}
              className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/20 text-foreground/50 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
            >
              <Plus className="size-5" />
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {liveCount} / {maxCount}
      </p>
      {error && <p className="text-sm text-status-urgent">{error}</p>}
    </div>
  );
}
