"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState } from "react";
import { getVisitInputErrors, VisitInputErrorCode } from "@/server/visit-rules";

export interface VisitFormValues {
  visitDate: string;
  visitTime: string;
  note: string;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyVisitFormValues(): VisitFormValues {
  return { visitDate: todayIsoDate(), visitTime: "", note: "" };
}

interface VisitFormProps {
  mode: "add" | "edit";
  initialValues: VisitFormValues;
  submitting: boolean;
  serverErrors: VisitInputErrorCode[];
  onSubmit: (values: VisitFormValues) => void;
  onCancel: () => void;
}

const FIELD_FOR_ERROR: Partial<Record<VisitInputErrorCode, keyof VisitFormValues>> = {
  visitDateInvalid: "visitDate",
  noteTooLong: "note",
};

function toCandidate(values: VisitFormValues) {
  return {
    visitDate: values.visitDate === "" ? null : new Date(values.visitDate),
    visitTime: values.visitTime === "" ? null : new Date(`1970-01-01T${values.visitTime}:00.000Z`),
    note: values.note.trim() === "" ? null : values.note.trim(),
  };
}

// Formularz dodania/edycji wejścia. Reguła walidacji (visitDate wymagane, note ≤ 80
// znaków) jest egzekwowana tu tą samą funkcją co po stronie API — @/server/visit-rules —
// dla natychmiastowej informacji zwrotnej; API i tak waliduje niezależnie.
export function VisitForm({
  mode,
  initialValues,
  submitting,
  serverErrors,
  onSubmit,
  onCancel,
}: VisitFormProps) {
  const [values, setValues] = useState<VisitFormValues>(initialValues);
  const [clientErrors, setClientErrors] = useState<VisitInputErrorCode[]>([]);
  const formId = useId();

  const errors = clientErrors.length > 0 ? clientErrors : serverErrors;
  const errorFor = (field: keyof VisitFormValues) =>
    errors.find((code) => FIELD_FOR_ERROR[code] === field);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const foundErrors = getVisitInputErrors(toCandidate(values));
    setClientErrors(foundErrors);
    if (foundErrors.length === 0) {
      onSubmit(values);
    }
  }

  const t = useTranslations("visitForm");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{mode === "add" ? t("addTitle") : t("editTitle")}</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-date`} className="text-sm font-medium">
          {t("visitDateLabel")}
        </label>
        <input
          id={`${formId}-date`}
          type="date"
          value={values.visitDate}
          disabled={submitting}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, visitDate: event.target.value }))
          }
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
        {errorFor("visitDate") && (
          <p className="text-sm text-status-urgent">{t(`errors.${errorFor("visitDate")}`)}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-time`} className="text-sm font-medium">
          {t("visitTimeLabel")}
        </label>
        <input
          id={`${formId}-time`}
          type="time"
          value={values.visitTime}
          disabled={submitting}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, visitTime: event.target.value }))
          }
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("visitTimeHint")}</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-note`} className="text-sm font-medium">
          {t("noteLabel")}
        </label>
        <input
          id={`${formId}-note`}
          type="text"
          maxLength={80}
          value={values.note}
          disabled={submitting}
          onChange={(event) => setValues((prev) => ({ ...prev, note: event.target.value }))}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("noteHint")}</p>
        {errorFor("note") && (
          <p className="text-sm text-status-urgent">{t(`errors.${errorFor("note")}`)}</p>
        )}
      </div>

      {serverErrors.length > 0 && clientErrors.length === 0 && (
        <p className="text-sm text-status-urgent">{t("errors.saveFailed")}</p>
      )}

      <div className="mt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-full px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          {t("cancelButton")}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-mint px-4 py-2 text-sm font-semibold text-mint-ink hover:brightness-95 disabled:opacity-50"
        >
          {submitting ? t("savingButton") : t("saveButton")}
        </button>
      </div>
    </form>
  );
}
