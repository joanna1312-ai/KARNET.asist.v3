"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CardType } from "@/generated/prisma/enums";
import { CardInputErrorCode, getCardInputErrors } from "@/server/card-rules";
import type { CategoryColor } from "@/server/system-categories";
import {
  isAllowedVoucherContentType,
  VOUCHER_FILE_ACCEPT,
  VOUCHER_FILE_MAX_BYTES,
  VOUCHER_FILE_MAX_COUNT,
} from "@/server/voucher-file";
import type { VoucherFile } from "@/lib/voucher-upload";
import { CategoryPicker, NEW_CATEGORY_SENTINEL } from "./CategoryPicker";
import { PlacesAutocomplete } from "./PlacesAutocomplete";
import { VoucherFilesGrid } from "./VoucherFilesGrid";

export { NEW_CATEGORY_SENTINEL };

export interface CompanyOption {
  id: string;
  name: string;
}

export interface CategoryOption {
  id: string;
  slug: string | null;
  name: string;
  color: CategoryColor;
  isSystem: boolean;
}

export type CompanyMode = "existing" | "new";

// Sposób podania vouchera (Sesja V4.3, ADR-009): "text" to zachowane pole tekstowe z
// Sesji 11 (kod rabatowy/link bez pliku), "file" to upload zdjęcia/PDF do Supabase
// Storage — nie oba naraz.
export type VoucherInputMode = "text" | "file";

export interface CardFormValues {
  companyMode: CompanyMode;
  companyId: string;
  newCompanyName: string;
  newCompanyLat: number | null;
  newCompanyLng: number | null;
  newCompanyGooglePlaceId: string | null;
  newCompanyAddress: string | null;
  newCompanyCategorySelection: string;
  newCategoryName: string;
  newCategoryColor: CategoryColor | "";
  type: CardType;
  totalVisits: string;
  expiryDate: string;
  // Treść/link wpisany ręcznie (Sesja 11) — niezależne od listy plików niżej (Sesja V6.2):
  // ustawienie jednego nie wpływa na drugie, mimo że w UI pokazywane są jako dwie karty
  // przełącznika `voucherInputMode`.
  voucherFileUrl: string;
  voucherInputMode: VoucherInputMode;
  // Pliki już zapisane na karnecie (puste dla nowego karnetu — kreator nie ma jeszcze id).
  voucherExistingFiles: VoucherFile[];
  // Id plików z `voucherExistingFiles` oznaczonych do usunięcia — odroczone do zapisu
  // formularza, jak dawne `voucherRemoveFile`.
  voucherFilesToRemove: string[];
  // Nowo wybrane pliki czekające na wgranie po zapisaniu karnetu (potrzebny jest już
  // istniejący id karnetu — patrz uploadVoucherFiles w lib/voucher-upload.ts).
  voucherNewFiles: File[];
}

export const emptyCardFormValues: CardFormValues = {
  companyMode: "existing",
  companyId: "",
  newCompanyName: "",
  newCompanyLat: null,
  newCompanyLng: null,
  newCompanyGooglePlaceId: null,
  newCompanyAddress: null,
  newCompanyCategorySelection: "",
  newCategoryName: "",
  newCategoryColor: "",
  type: CardType.limit,
  totalVisits: "",
  expiryDate: "",
  voucherFileUrl: "",
  voucherInputMode: "text",
  voucherExistingFiles: [],
  voucherFilesToRemove: [],
  voucherNewFiles: [],
};

// Kody błędów walidowane tylko po stronie klienta (dot. nowej firmy/kategorii) — nie
// istnieją w CardInputErrorCode, bo API karnetów o nich nie wie: firma/kategoria są
// tworzone osobnymi wywołaniami (POST /api/categories, POST /api/companies), zanim
// powstanie/zaktualizuje się karnet.
type NewCompanyErrorCode =
  | "newCompanyNameRequired"
  | "newCompanyCategoryRequired"
  | "newCategoryNameRequired"
  | "newCategoryColorRequired";
// Walidacja plików wybranych w trybie "file" — API o niej nie wie (rozmiar/typ
// egzekwuje docelowo konfiguracja bucketa w Supabase), więc kod błędu istnieje tylko
// po stronie klienta, jak przy NewCompanyErrorCode wyżej.
type VoucherFileErrorCode = "voucherFileTooLarge" | "voucherFileTypeUnsupported";
type FormErrorCode = CardInputErrorCode | NewCompanyErrorCode | VoucherFileErrorCode;

interface CardFormProps {
  mode: "add" | "edit" | "renew";
  companies: CompanyOption[];
  categories: CategoryOption[];
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
  newCompanyNameRequired: "newCompanyName",
  newCompanyCategoryRequired: "newCompanyCategorySelection",
  newCategoryNameRequired: "newCategoryName",
  newCategoryColorRequired: "newCategoryColor",
  voucherFileTooLarge: "voucherNewFiles",
  voucherFileTypeUnsupported: "voucherNewFiles",
};

// Wylicza wartość `voucherFileUrl` do wysłania w payloadzie POST/PATCH /api/cards (Sesja
// 11). Niezależne od listy plików (Sesja V6.2) — ta idzie osobnymi wywołaniami po
// zapisaniu karnetu (patrz uploadVoucherFiles w lib/voucher-upload.ts), bo endpoint
// uploadu/usuwania potrzebuje już istniejącego id karnetu.
export function voucherFileUrlForSave(values: CardFormValues): string | null {
  const trimmed = values.voucherFileUrl.trim();
  return trimmed === "" ? null : trimmed;
}

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
    voucherFileUrl: values.voucherFileUrl === "" ? null : values.voucherFileUrl,
  };
}

// Wspólny formularz kreatora i edycji karnetu. Reguła unlimited/limit jest
// egzekwowana tu (ta sama funkcja co po stronie API — @/server/card-rules), dla
// natychmiastowej informacji zwrotnej; API i tak waliduje niezależnie.
export function CardForm({
  mode,
  companies,
  categories,
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
      if (!values.newCompanyCategorySelection) {
        newCompanyErrors.push("newCompanyCategoryRequired");
      } else if (values.newCompanyCategorySelection === NEW_CATEGORY_SENTINEL) {
        if (values.newCategoryName.trim().length === 0) {
          newCompanyErrors.push("newCategoryNameRequired");
        }
        if (!values.newCategoryColor) {
          newCompanyErrors.push("newCategoryColorRequired");
        }
      }
    }

    const voucherFileErrors: VoucherFileErrorCode[] = [];
    if (values.voucherInputMode === "file") {
      for (const file of values.voucherNewFiles) {
        if (!isAllowedVoucherContentType(file.type)) {
          voucherFileErrors.push("voucherFileTypeUnsupported");
          break;
        }
        if (file.size > VOUCHER_FILE_MAX_BYTES) {
          voucherFileErrors.push("voucherFileTooLarge");
          break;
        }
      }
    }

    const foundErrors: FormErrorCode[] = [
      ...newCompanyErrors,
      ...voucherFileErrors,
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
        <div className="flex flex-wrap gap-4">
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
            <Select
              id={`${formId}-company`}
              value={values.companyId}
              disabled={submitting}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, companyId: event.target.value }))
              }
            >
              <option value="" disabled>
                {t("companyPlaceholder")}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
            {errorFor("companyId") && (
              <p className="text-sm text-status-urgent">
                {t(`errors.${errorFor("companyId")}`)}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
            <div className="flex flex-col gap-1">
              <label htmlFor={`${formId}-new-company-name`} className="text-sm font-medium">
                {t("newCompanyNameLabel")}
              </label>
              {/* Wyszukiwanie przez Google Places API (New) — Sesja V4.1 (ADR-004). Wybór
                  podpowiedzi ustawia lat/lng/googlePlaceId; ręczne wpisanie nazwy bez
                  wyboru podpowiedzi nadal działa (te trzy pola zostają puste, jak przed
                  tą sesją). */}
              <PlacesAutocomplete
                id={`${formId}-new-company-name`}
                value={values.newCompanyName}
                disabled={submitting}
                placeholder={t("newCompanyNamePlaceholder")}
                noResultsLabel={t("placesNoResults")}
                onChange={(newCompanyName) =>
                  setValues((prev) => ({
                    ...prev,
                    newCompanyName,
                    newCompanyLat: null,
                    newCompanyLng: null,
                    newCompanyGooglePlaceId: null,
                    newCompanyAddress: null,
                  }))
                }
                onPlaceSelect={(place) =>
                  setValues((prev) => ({
                    ...prev,
                    newCompanyName: place.name,
                    newCompanyLat: place.lat,
                    newCompanyLng: place.lng,
                    newCompanyGooglePlaceId: place.googlePlaceId,
                    newCompanyAddress: place.address,
                  }))
                }
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("mapsSearchHint")}</p>
              {errorFor("newCompanyName") && (
                <p className="text-sm text-status-urgent">
                  {t(`errors.${errorFor("newCompanyName")}`)}
                </p>
              )}
            </div>

            <CategoryPicker
              idPrefix={`${formId}-new-company`}
              categories={categories}
              disabled={submitting}
              categorySelection={values.newCompanyCategorySelection}
              onCategorySelectionChange={(newCompanyCategorySelection) =>
                setValues((prev) => ({ ...prev, newCompanyCategorySelection }))
              }
              newCategoryName={values.newCategoryName}
              onNewCategoryNameChange={(newCategoryName) =>
                setValues((prev) => ({ ...prev, newCategoryName }))
              }
              newCategoryColor={values.newCategoryColor}
              onNewCategoryColorChange={(newCategoryColor) =>
                setValues((prev) => ({ ...prev, newCategoryColor }))
              }
              categoryLabel={t("categoryLabel")}
              categoryPlaceholder={t("categoryPlaceholder")}
              newCategoryOptionLabel={t("newCategoryOption")}
              newCategoryNameLabel={t("newCategoryNameLabel")}
              newCategoryNamePlaceholder={t("newCategoryNamePlaceholder")}
              newCategoryColorLabel={t("newCategoryColorLabel")}
              categoryColorName={(color) => t(`categoryColors.${color}`)}
              categoryTranslation={tCategory}
              categoryError={
                errorFor("newCompanyCategorySelection")
                  ? t(`errors.${errorFor("newCompanyCategorySelection")}`)
                  : undefined
              }
              newCategoryNameError={
                errorFor("newCategoryName") ? t(`errors.${errorFor("newCategoryName")}`) : undefined
              }
              newCategoryColorError={
                errorFor("newCategoryColor")
                  ? t(`errors.${errorFor("newCategoryColor")}`)
                  : undefined
              }
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("typeLabel")}</span>
        <div className="flex flex-wrap gap-4">
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
          <Input
            id={`${formId}-total-visits`}
            type="number"
            min={1}
            value={values.totalVisits}
            disabled={submitting}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, totalVisits: event.target.value }))
            }
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
        <Input
          id={`${formId}-expiry`}
          type="date"
          value={values.expiryDate}
          disabled={submitting}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, expiryDate: event.target.value }))
          }
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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("voucherSectionLabel")}</span>
        <div className="flex flex-wrap gap-4">
          {(["text", "file"] as const).map((inputModeOption) => (
            <label key={inputModeOption} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`${formId}-voucher-input-mode`}
                value={inputModeOption}
                checked={values.voucherInputMode === inputModeOption}
                disabled={submitting}
                onChange={() =>
                  setValues((prev) => ({ ...prev, voucherInputMode: inputModeOption }))
                }
              />
              {t(`voucherInputModeOptions.${inputModeOption}`)}
            </label>
          ))}
        </div>

        {values.voucherInputMode === "text" ? (
          <>
            <label htmlFor={`${formId}-voucher-file-url`} className="text-sm font-medium">
              {t("voucherFileUrlLabel")}
            </label>
            <Input
              id={`${formId}-voucher-file-url`}
              type="text"
              value={values.voucherFileUrl}
              disabled={submitting}
              placeholder={t("voucherFileUrlPlaceholder")}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, voucherFileUrl: event.target.value }))
              }
            />
          </>
        ) : (
          <VoucherFilesGrid
            existingFiles={values.voucherExistingFiles}
            filesToRemove={values.voucherFilesToRemove}
            newFiles={values.voucherNewFiles}
            onToggleRemoveExisting={(id) =>
              setValues((prev) => ({
                ...prev,
                voucherFilesToRemove: prev.voucherFilesToRemove.includes(id)
                  ? prev.voucherFilesToRemove.filter((removeId) => removeId !== id)
                  : [...prev.voucherFilesToRemove, id],
              }))
            }
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
            error={errorFor("voucherNewFiles") ? t(`errors.${errorFor("voucherNewFiles")}`) : undefined}
          />
        )}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("voucherFileUrlHint")}
        </p>
      </div>

      {serverErrors.length > 0 && clientErrors.length === 0 && (
        <p className="text-sm text-status-urgent">{t("errors.saveFailed")}</p>
      )}

      <div className="mt-2 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          {t("cancelButton")}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? t("savingButton") : t("saveButton")}
        </Button>
      </div>
    </form>
  );
}
