"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { VoucherMode } from "@/generated/prisma/enums";
import { isStorageVoucherFileUrl, VOUCHER_FILE_ACCEPT } from "@/server/voucher-file";
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
        <div className="flex flex-col gap-2">
          {isStorageVoucherFileUrl(values.voucherFileUrl) &&
            !values.voucherFile &&
            !values.voucherRemoveFile && (
              <p className="text-sm text-foreground/70">
                {t("voucherCurrentFileLabel")}{" "}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setValues((prev) => ({ ...prev, voucherRemoveFile: true }))}
                  className="font-medium text-status-urgent hover:underline"
                >
                  {t("voucherRemoveButton")}
                </button>
              </p>
            )}
          <label className="text-sm font-semibold">{t("voucherFileLabel")}</label>
          {/* capture="environment" — na telefonie otwiera od razu aparat tylny (README, PWA scope) */}
          <input
            type="file"
            accept={VOUCHER_FILE_ACCEPT}
            capture="environment"
            disabled={submitting}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setValues((prev) => ({ ...prev, voucherFile: file, voucherRemoveFile: false }));
            }}
            className="text-sm"
          />
          {values.voucherFile && (
            <p className="text-sm text-foreground/50">{values.voucherFile.name}</p>
          )}
          {fieldErrors.voucherFile && (
            <p className="text-sm text-status-urgent">{fieldErrors.voucherFile}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold">{t("voucherModeLabel")}</label>
        <Select
          value={values.voucherMode}
          disabled={submitting}
          className="rounded-full px-4 py-3"
          onChange={(event) =>
            setValues((prev) => ({ ...prev, voucherMode: event.target.value as VoucherMode }))
          }
        >
          {(Object.values(VoucherMode) as VoucherMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {t(`voucherModeOptions.${mode}`)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
