"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { NEW_CATEGORY_SENTINEL } from "@/components/CardForm";
import { CATEGORY_COLOR_CLASS, categoryDisplayName } from "@/lib/category-display";
import { DEFAULT_CATEGORY_ICON } from "@/lib/category-icons";
import { CATEGORY_COLOR_PALETTE } from "@/server/system-categories";
import type { StepProps } from "./types";

export function CompanyStep({ values, setValues, submitting, companies, categories, fieldErrors }: StepProps) {
  const t = useTranslations("cardForm");
  const tCategory = useTranslations("companyCategory");
  const placesId = useId();
  const selectedCategory = categories.find(
    (category) => category.id === values.newCompanyCategorySelection
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-brand text-2xl font-extrabold tracking-[-0.02em]">{t("step1Title")}</h1>
      </div>

      <div className="flex gap-1 rounded-full bg-black/5 p-1 dark:bg-white/10">
        {(["existing", "new"] as const).map((option) => (
          <button
            key={option}
            type="button"
            disabled={submitting}
            onClick={() => setValues((prev) => ({ ...prev, companyMode: option }))}
            className={`min-h-10 flex-1 rounded-full px-3 text-sm font-semibold transition-colors ${
              values.companyMode === option
                ? "bg-white text-foreground shadow-sm dark:bg-zinc-800"
                : "text-foreground/50"
            }`}
          >
            {t(`companyModeOptions.${option}`)}
          </button>
        ))}
      </div>

      {values.companyMode === "existing" ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold">{t("companyLabel")}</label>
          <Select
            value={values.companyId}
            disabled={submitting}
            className="rounded-2xl px-4 py-3"
            onChange={(event) => setValues((prev) => ({ ...prev, companyId: event.target.value }))}
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
          {fieldErrors.companyId && <p className="text-sm text-status-urgent">{fieldErrors.companyId}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">{t("newCompanyNameLabel")}</label>
            <PlacesAutocomplete
              id={placesId}
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
            <p className="text-xs text-foreground/50">{t("mapsSearchHint")}</p>
            {fieldErrors.newCompanyName && (
              <p className="text-sm text-status-urgent">{fieldErrors.newCompanyName}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">{t("categoryLabel")}</label>
            <div className="relative">
              {selectedCategory && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <CategoryIcon slug={selectedCategory.slug} color={selectedCategory.color} />
                </span>
              )}
              <Select
                value={values.newCompanyCategorySelection}
                disabled={submitting}
                className="rounded-2xl px-4 py-3"
                style={selectedCategory ? { paddingLeft: "2.75rem" } : undefined}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, newCompanyCategorySelection: event.target.value }))
                }
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
            {fieldErrors.newCompanyCategorySelection && (
              <p className="text-sm text-status-urgent">{fieldErrors.newCompanyCategorySelection}</p>
            )}
          </div>

          {values.newCompanyCategorySelection === NEW_CATEGORY_SENTINEL && (
            <div className="flex flex-col gap-4 rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">{t("newCategoryNameLabel")}</label>
                <Input
                  type="text"
                  value={values.newCategoryName}
                  disabled={submitting}
                  placeholder={t("newCategoryNamePlaceholder")}
                  className="rounded-2xl px-4 py-3"
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, newCategoryName: event.target.value }))
                  }
                />
                {fieldErrors.newCategoryName && (
                  <p className="text-sm text-status-urgent">{fieldErrors.newCategoryName}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">{t("newCategoryColorLabel")}</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      disabled={submitting}
                      aria-pressed={values.newCategoryColor === color}
                      aria-label={t(`categoryColors.${color}`)}
                      title={t(`categoryColors.${color}`)}
                      onClick={() => setValues((prev) => ({ ...prev, newCategoryColor: color }))}
                      className={`flex size-11 items-center justify-center rounded-full text-white ${CATEGORY_COLOR_CLASS[color]} ${
                        values.newCategoryColor === color
                          ? "ring-2 ring-offset-2 ring-black/60 dark:ring-white/60 dark:ring-offset-background"
                          : ""
                      }`}
                    >
                      <DEFAULT_CATEGORY_ICON className="size-5" strokeWidth={2} />
                    </button>
                  ))}
                </div>
                {fieldErrors.newCategoryColor && (
                  <p className="text-sm text-status-urgent">{fieldErrors.newCategoryColor}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
