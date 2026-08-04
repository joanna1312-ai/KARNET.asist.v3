"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState } from "react";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { CardInputErrorCode, getCardInputErrors } from "@/server/card-rules";

export interface CompanyOption {
  id: string;
  name: string;
}

export interface CardFormValues {
  companyId: string;
  type: CardType;
  totalVisits: string;
  expiryDate: string;
  voucherMode: VoucherMode;
}

export const emptyCardFormValues: CardFormValues = {
  companyId: "",
  type: CardType.limit,
  totalVisits: "",
  expiryDate: "",
  voucherMode: VoucherMode.single,
};

interface CardFormProps {
  mode: "add" | "edit";
  companies: CompanyOption[];
  initialValues?: CardFormValues;
  submitting: boolean;
  serverErrors: CardInputErrorCode[];
  onSubmit: (values: CardFormValues) => void;
  onCancel: () => void;
}

const FIELD_FOR_ERROR: Record<CardInputErrorCode, keyof CardFormValues> = {
  companyRequired: "companyId",
  typeRequired: "type",
  expiryDateRequiredForUnlimited: "expiryDate",
  totalVisitsRequiredForLimit: "totalVisits",
  totalVisitsPositive: "totalVisits",
  voucherModeRequired: "voucherMode",
};

function toCandidate(values: CardFormValues) {
  return {
    companyId: values.companyId || null,
    type: values.type,
    totalVisits: values.totalVisits === "" ? null : Number(values.totalVisits),
    expiryDate: values.expiryDate === "" ? null : new Date(values.expiryDate),
    voucherMode: values.voucherMode,
  };
}

// Wspólny formularz kreatora i edycji karnetu. Reguła unlimited/limit jest
// egzekwowana tu (ta sama funkcja co po stronie API — @/server/card-rules), dla
// natychmiastowej informacji zwrotnej; API i tak waliduje niezależnie.
export function CardForm({
  mode,
  companies,
  initialValues,
  submitting,
  serverErrors,
  onSubmit,
  onCancel,
}: CardFormProps) {
  const [values, setValues] = useState<CardFormValues>(
    initialValues ?? emptyCardFormValues
  );
  const [clientErrors, setClientErrors] = useState<CardInputErrorCode[]>([]);
  const formId = useId();

  const errors = clientErrors.length > 0 ? clientErrors : serverErrors;
  const errorFor = (field: keyof CardFormValues) =>
    errors.find((code) => FIELD_FOR_ERROR[code] === field);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const foundErrors = getCardInputErrors(toCandidate(values));
    setClientErrors(foundErrors);
    if (foundErrors.length === 0) {
      onSubmit(values);
    }
  }

  const t = useTranslations("cardForm");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        {mode === "add" ? t("addTitle") : t("editTitle")}
      </h2>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-company`} className="text-sm font-medium">
          {t("companyLabel")}
        </label>
        <select
          id={`${formId}-company`}
          value={values.companyId}
          disabled={submitting}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, companyId: event.target.value }))
          }
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="" disabled>
            {t("companyPlaceholder")}
          </option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        {errorFor("companyId") && (
          <p className="text-sm text-status-urgent">
            {t(`errors.${errorFor("companyId")}`)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("typeLabel")}</span>
        <div className="flex gap-4">
          {(Object.values(CardType) as CardType[]).map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`${formId}-type`}
                value={type}
                checked={values.type === type}
                disabled={submitting}
                onChange={() =>
                  setValues((prev) => ({
                    ...prev,
                    type,
                    totalVisits: type === CardType.unlimited ? "" : prev.totalVisits,
                  }))
                }
              />
              {t(`typeOptions.${type}`)}
            </label>
          ))}
        </div>
        {errorFor("type") && (
          <p className="text-sm text-status-urgent">{t(`errors.${errorFor("type")}`)}</p>
        )}
      </div>

      {values.type === CardType.limit && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-total-visits`} className="text-sm font-medium">
            {t("totalVisitsLabel")}
          </label>
          <input
            id={`${formId}-total-visits`}
            type="number"
            min={1}
            value={values.totalVisits}
            disabled={submitting}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, totalVisits: event.target.value }))
            }
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          />
          {errorFor("totalVisits") && (
            <p className="text-sm text-status-urgent">
              {t(`errors.${errorFor("totalVisits")}`)}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-expiry`} className="text-sm font-medium">
          {t("expiryDateLabel")}
        </label>
        <input
          id={`${formId}-expiry`}
          type="date"
          value={values.expiryDate}
          disabled={submitting}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, expiryDate: event.target.value }))
          }
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {values.type === CardType.unlimited
            ? t("expiryDateHintRequired")
            : t("expiryDateHintOptional")}
        </p>
        {errorFor("expiryDate") && (
          <p className="text-sm text-status-urgent">
            {t(`errors.${errorFor("expiryDate")}`)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-voucher-mode`} className="text-sm font-medium">
          {t("voucherModeLabel")}
        </label>
        <select
          id={`${formId}-voucher-mode`}
          value={values.voucherMode}
          disabled={submitting}
          onChange={(event) =>
            setValues((prev) => ({
              ...prev,
              voucherMode: event.target.value as VoucherMode,
            }))
          }
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          {(Object.values(VoucherMode) as VoucherMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {t(`voucherModeOptions.${mode}`)}
            </option>
          ))}
        </select>
        {errorFor("voucherMode") && (
          <p className="text-sm text-status-urgent">
            {t(`errors.${errorFor("voucherMode")}`)}
          </p>
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
