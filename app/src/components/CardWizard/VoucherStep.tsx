"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { VoucherFilesGrid } from "@/components/VoucherFilesGrid";
import { VOUCHER_FILE_ACCEPT, VOUCHER_FILE_MAX_COUNT } from "@/server/voucher-file";
import type { StepProps } from "./types";

export function VoucherStep({ values, setValues, submitting, fieldErrors }: StepProps) {
  const t = useTranslations("cardForm");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-brand text-2xl font-extrabold tracking-[-0.02em]">{t("step3Title")}</h1>
        <p className="mt-1 text-sm text-foreground/50">{t("voucherSkipHint")}</p>
      </div>

      <div className="flex gap-1 rounded-full bg-black/5 p-1 dark:bg-white/10">
        {(["text", "file"] as const).map((option) => (
          <button
            key={option}
            type="button"
            disabled={submitting}
            onClick={() => setValues((prev) => ({ ...prev, voucherInputMode: option }))}
            className={`min-h-10 flex-1 rounded-full px-3 text-sm font-semibold transition-colors ${
              values.voucherInputMode === option
                ? "bg-white text-foreground shadow-sm dark:bg-zinc-800"
                : "text-foreground/50"
            }`}
          >
            {t(`voucherInputModeOptions.${option}`)}
          </button>
        ))}
      </div>

      {values.voucherInputMode === "text" ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold">{t("voucherFileUrlLabel")}</label>
          <Input
            type="text"
            value={values.voucherFileUrl}
            disabled={submitting}
            placeholder={t("voucherFileUrlPlaceholder")}
            className="rounded-full px-4 py-3"
            onChange={(event) => setValues((prev) => ({ ...prev, voucherFileUrl: event.target.value }))}
          />
        </div>
      ) : (
        // W kreatorze karnet jeszcze nie istnieje — voucherExistingFiles jest zawsze puste,
        // wszystkie wybrane pliki czekają w voucherNewFiles na wgranie po zapisaniu.
        <VoucherFilesGrid
          existingFiles={values.voucherExistingFiles}
          filesToRemove={values.voucherFilesToRemove}
          newFiles={values.voucherNewFiles}
          onToggleRemoveExisting={() => {}}
          onAddFile={(file) =>
            setValues((prev) => ({ ...prev, voucherNewFiles: [...prev.voucherNewFiles, file] }))
          }
          onRemoveNewFile={(index) =>
            setValues((prev) => ({
              ...prev,
              voucherNewFiles: prev.voucherNewFiles.filter((_, i) => i !== index),
            }))
          }
          disabled={submitting}
          maxCount={VOUCHER_FILE_MAX_COUNT}
          accept={VOUCHER_FILE_ACCEPT}
          error={fieldErrors.voucherNewFiles}
        />
      )}
    </div>
  );
}
