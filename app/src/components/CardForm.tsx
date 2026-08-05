"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState } from "react";
import { CardType, CompanyCategory, VoucherMode } from "@/generated/prisma/enums";
import { CardInputErrorCode, getCardInputErrors } from "@/server/card-rules";

export interface CompanyOption {
  id: string;
  name: string;
}

export type CompanyMode = "existing" | "new";

export interface CardFormValues {
  companyMode: CompanyMode;
  companyId: string;
  newCompanyName: string;
  newCompanyCategory: CompanyCategory | "";
  type: CardType;
  totalVisits: string;
  expiryDate: string;
  voucherMode: VoucherMode;
  voucherFileUrl: string;
}

export const emptyCardFormValues: CardFormValues = {
  companyMode: "existing",
  companyId: "",
  newCompanyName: "",
  newCompanyCategory: "",
  type: CardType.limit,
  totalVisits: "",
  expiryDate: "",
  voucherMode: VoucherMode.single,
  voucherFileUrl: "",
};

// Kody błędów walidowane tylko po stronie klienta (dot. nowej firmy) — nie istnieją w
// CardInputErrorCode, bo API karnetów o nich nie wie: firma jest tworzona osobnym
// wywołaniem (POST /api/companies), zanim powstanie/zaktualizuje się karnet.
type NewCompanyErrorCode = "newCompanyNameRequired" | "newCompanyCategoryRequired";
type FormErrorCode = CardInputErrorCode | NewCompanyErrorCode;

interface CardFormProps {
  mode: "add" | "edit" | "renew";
  companies: CompanyOption[];
  initialValues?: CardFormValues;
  submitting: boolean;
  serverErrors: CardInputErrorCode[];
  onSubmit: (values: CardFormValues) => void;
  onCancel: () => void;
}

const FIELD_FOR_ERROR: Record<FormErrorCode, keyof CardFormValues> = {
  companyRequired: "companyId",
  typeRequired: "type",
  expiryDateRequiredForUnlimited: "expiryDate",
  totalVisitsRequiredForLimit: "totalVisits",
  totalVisitsPositive: "totalVisits",
  voucherModeRequired: "voucherMode",
  newCompanyNameRequired: "newCompanyName",
  newCompanyCategoryRequired: "newCompanyCategory",
};

function toCandidate(values: CardFormValues) {
  return {
    // W trybie "nowa firma" companyId nie istnieje jeszcze (firma powstaje osobno,
    // przed kreatorem karnetu) — "pending" tylko po to, żeby nie odpalać tu
    // companyRequired; realną walidację nazwy/kategorii robi handleSubmit niżej.
    companyId:
      values.companyMode === "new" ? "pending" : values.companyId || null,
    type: values.type,
    totalVisits: values.totalVisits === "" ? null : Number(values.totalVisits),
    expiryDate: values.expiryDate === "" ? null : new Date(values.expiryDate),
    voucherMode: values.voucherMode,
    voucherFileUrl: values.voucherFileUrl === "" ? null : values.voucherFileUrl,
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
  const [clientErrors, setClientErrors] = useState<FormErrorCode[]>([]);
  const formId = useId();

  const errors: FormErrorCode[] = clientErrors.length > 0 ? clientErrors : serverErrors;
  const errorFor = (field: keyof CardFormValues) =>
    errors.find((code) => FIELD_FOR_ERROR[code] === field);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const newCompanyErrors: NewCompanyErrorCode[] = [];
    if (values.companyMode === "new") {
      if (values.newCompanyName.trim().length === 0) {
        newCompanyErrors.push("newCompanyNameRequired");
      }
      if (!values.newCompanyCategory) {
        newCompanyErrors.push("newCompanyCategoryRequired");
      }
    }

    const foundErrors: FormErrorCode[] = [
      ...newCompanyErrors,
      ...getCardInputErrors(toCandidate(values)),
    ];
    setClientErrors(foundErrors);
    if (foundErrors.length === 0) {
      onSubmit(values);
    }
  }

  const t = useTranslations("cardForm");
  const tCategory = useTranslations("companyCategory");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        {mode === "edit" ? t("editTitle") : mode === "renew" ? t("renewTitle") : t("addTitle")}
      </h2>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("companyLabel")}</span>
        <div className="flex gap-4">
          {(["existing", "new"] as const).map((companyModeOption) => (
            <label key={companyModeOption} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`${formId}-company-mode`}
                value={companyModeOption}
                checked={values.companyMode === companyModeOption}
                disabled={submitting}
                onChange={() =>
                  setValues((prev) => ({ ...prev, companyMode: companyModeOption }))
                }
              />
              {t(`companyModeOptions.${companyModeOption}`)}
            </label>
          ))}
        </div>

        {values.companyMode === "existing" ? (
          <>
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
          </>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
            {/* Miejsce pod przyszłą integrację Google Places (ADR-004) — na razie
                bez podłączonego API, tylko wizualna zaślepka na przyszłe wyszukiwanie. */}
            <input
              type="text"
              disabled
              placeholder={t("mapsSearchPlaceholder")}
              className="rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("mapsSearchHint")}
            </p>

            <div className="flex flex-col gap-1">
              <label htmlFor={`${formId}-new-company-name`} className="text-sm font-medium">
                {t("newCompanyNameLabel")}
              </label>
              <input
                id={`${formId}-new-company-name`}
                type="text"
                value={values.newCompanyName}
                disabled={submitting}
                placeholder={t("newCompanyNamePlaceholder")}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, newCompanyName: event.target.value }))
                }
                className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              />
              {errorFor("newCompanyName") && (
                <p className="text-sm text-status-urgent">
                  {t(`errors.${errorFor("newCompanyName")}`)}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${formId}-new-company-category`}
                className="text-sm font-medium"
              >
                {t("categoryLabel")}
              </label>
              <select
                id={`${formId}-new-company-category`}
                value={values.newCompanyCategory}
                disabled={submitting}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    newCompanyCategory: event.target.value as CompanyCategory,
                  }))
                }
                className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              >
                <option value="" disabled>
                  {t("categoryPlaceholder")}
                </option>
                {(Object.values(CompanyCategory) as CompanyCategory[]).map((category) => (
                  <option key={category} value={category}>
                    {tCategory(category)}
                  </option>
                ))}
              </select>
              {errorFor("newCompanyCategory") && (
                <p className="text-sm text-status-urgent">
                  {t(`errors.${errorFor("newCompanyCategory")}`)}
                </p>
              )}
            </div>
          </div>
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

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-voucher-file-url`} className="text-sm font-medium">
          {t("voucherFileUrlLabel")}
        </label>
        <input
          id={`${formId}-voucher-file-url`}
          type="text"
          value={values.voucherFileUrl}
          disabled={submitting}
          placeholder={t("voucherFileUrlPlaceholder")}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, voucherFileUrl: event.target.value }))
          }
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("voucherFileUrlHint")}
        </p>
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
