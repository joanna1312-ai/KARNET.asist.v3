"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { CATEGORY_COLOR_CLASS, categoryDisplayName } from "@/lib/category-display";
import { DEFAULT_CATEGORY_ICON } from "@/lib/category-icons";
import { CardInputErrorCode, getCardInputErrors } from "@/server/card-rules";
import { CATEGORY_COLOR_PALETTE, type CategoryColor } from "@/server/system-categories";
import {
  isAllowedVoucherContentType,
  VOUCHER_FILE_ACCEPT,
  VOUCHER_FILE_MAX_BYTES,
  VOUCHER_FILE_MAX_COUNT,
} from "@/server/voucher-file";
import type { VoucherFile } from "@/lib/voucher-upload";
import { PlacesAutocomplete } from "./PlacesAutocomplete";
import { VoucherFilesGrid } from "./VoucherFilesGrid";

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

// Sentinel w selekcie kategorii: "dodaj własną kategorię" zamiast wybrania istniejącej
// (Sesja 16). Nie może kolidować z prawdziwym uuid kategorii.
export const NEW_CATEGORY_SENTINEL = "__new__";

export interface CardFormValues {
  companyMode: CompanyMode;
  companyId: string;
  newCompanyName: string;
  newCompanyLat: number | null;
  newCompanyLng: number | null;
  newCompanyGooglePlaceId: string | null;
  newCompanyCategorySelection: string;
  newCategoryName: string;
  newCategoryColor: CategoryColor | "";
  type: CardType;
  totalVisits: string;
  expiryDate: string;
  voucherMode: VoucherMode;
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
  newCompanyCategorySelection: "",
  newCategoryName: "",
  newCategoryColor: "",
  type: CardType.limit,
  totalVisits: "",
  expiryDate: "",
  voucherMode: VoucherMode.single,
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
  voucherModeRequired: "voucherMode",
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
  const selectedCategory = categories.find(
    (category) => category.id === values.newCompanyCategorySelection
  );

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
                  }))
                }
                onPlaceSelect={(place) =>
                  setValues((prev) => ({
                    ...prev,
                    newCompanyName: place.name,
                    newCompanyLat: place.lat,
                    newCompanyLng: place.lng,
                    newCompanyGooglePlaceId: place.googlePlaceId,
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

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${formId}-new-company-category`}
                className="text-sm font-medium"
              >
                {t("categoryLabel")}
              </label>
              <div className="relative">
                {selectedCategory && (
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                    <CategoryIcon slug={selectedCategory.slug} color={selectedCategory.color} />
                  </span>
                )}
                <Select
                  id={`${formId}-new-company-category`}
                  value={values.newCompanyCategorySelection}
                  disabled={submitting}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      newCompanyCategorySelection: event.target.value,
                    }))
                  }
                  style={selectedCategory ? { paddingLeft: "2.5rem" } : undefined}
                >
                  <option value="" disabled>
                    {t("categoryPlaceholder")}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {categoryDisplayName(category, tCategory)}
                    </option>
                  ))}
                  <option value={NEW_CATEGORY_SENTINEL}>{t("newCategoryOption")}</option>
                </Select>
              </div>
              {errorFor("newCompanyCategorySelection") && (
                <p className="text-sm text-status-urgent">
                  {t(`errors.${errorFor("newCompanyCategorySelection")}`)}
                </p>
              )}
            </div>

            {values.newCompanyCategorySelection === NEW_CATEGORY_SENTINEL && (
              <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={`${formId}-new-category-name`}
                    className="text-sm font-medium"
                  >
                    {t("newCategoryNameLabel")}
                  </label>
                  <Input
                    id={`${formId}-new-category-name`}
                    type="text"
                    value={values.newCategoryName}
                    disabled={submitting}
                    placeholder={t("newCategoryNamePlaceholder")}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, newCategoryName: event.target.value }))
                    }
                  />
                  {errorFor("newCategoryName") && (
                    <p className="text-sm text-status-urgent">
                      {t(`errors.${errorFor("newCategoryName")}`)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{t("newCategoryColorLabel")}</span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        disabled={submitting}
                        aria-pressed={values.newCategoryColor === color}
                        aria-label={t(`categoryColors.${color}`)}
                        title={t(`categoryColors.${color}`)}
                        onClick={() =>
                          setValues((prev) => ({ ...prev, newCategoryColor: color }))
                        }
                        className={`flex size-11 items-center justify-center rounded-full text-white ${CATEGORY_COLOR_CLASS[color]} ${
                          values.newCategoryColor === color
                            ? "ring-2 ring-offset-2 ring-black/60 dark:ring-white/60 dark:ring-offset-black"
                            : ""
                        }`}
                      >
                        <DEFAULT_CATEGORY_ICON className="size-5" strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                  {errorFor("newCategoryColor") && (
                    <p className="text-sm text-status-urgent">
                      {t(`errors.${errorFor("newCategoryColor")}`)}
                    </p>
                  )}
                </div>
              </div>
            )}
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

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-voucher-mode`} className="text-sm font-medium">
          {t("voucherModeLabel")}
        </label>
        <Select
          id={`${formId}-voucher-mode`}
          value={values.voucherMode}
          disabled={submitting}
          onChange={(event) =>
            setValues((prev) => ({
              ...prev,
              voucherMode: event.target.value as VoucherMode,
            }))
          }
        >
          {(Object.values(VoucherMode) as VoucherMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {t(`voucherModeOptions.${mode}`)}
            </option>
          ))}
        </Select>
        {errorFor("voucherMode") && (
          <p className="text-sm text-status-urgent">
            {t(`errors.${errorFor("voucherMode")}`)}
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
