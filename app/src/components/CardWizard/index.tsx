"use client";

import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  CardFormValues,
  CategoryOption,
  CompanyOption,
  emptyCardFormValues,
  NEW_CATEGORY_SENTINEL,
} from "@/components/CardForm";
import { Button } from "@/components/ui/Button";
import { CardType } from "@/generated/prisma/enums";
import { categoryDisplayName } from "@/lib/category-display";
import { isAllowedVoucherContentType, VOUCHER_FILE_MAX_BYTES } from "@/server/voucher-file";
import { CardInputErrorCode } from "@/server/card-rules";
import { CompanyStep } from "./CompanyStep";
import { TypeStep } from "./TypeStep";
import { VoucherStep } from "./VoucherStep";

const TOTAL_STEPS = 3;

type CardWizardProps = {
  companies: CompanyOption[];
  categories: CategoryOption[];
  submitting: boolean;
  serverErrors: CardInputErrorCode[];
  onSubmit: (values: CardFormValues) => void;
  onCancel: () => void;
};

export function CardWizard({
  companies,
  categories,
  submitting,
  serverErrors,
  onSubmit,
  onCancel,
}: CardWizardProps) {
  const t = useTranslations("cardForm");
  const tCategory = useTranslations("companyCategory");
  const [step, setStep] = useState(1);
  // Domyślnie 10 wejść od razu widoczne w kroku 2 (dopasowane do najczęstszego wyboru z
  // pigułek-skrótów) — desktopowy CardForm zostaje przy pustym polu, tu chodzi tylko o
  // to, żeby stepper nie startował od zera zanim ktokolwiek go dotknie.
  const [values, setValues] = useState<CardFormValues>({ ...emptyCardFormValues, totalVisits: "10" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CardFormValues, string>>>({});

  function validateStep1(): Partial<Record<keyof CardFormValues, string>> {
    const errors: Partial<Record<keyof CardFormValues, string>> = {};
    if (values.companyMode === "existing") {
      if (!values.companyId) errors.companyId = t("errors.companyRequired");
    } else {
      if (values.newCompanyName.trim().length === 0) {
        errors.newCompanyName = t("errors.newCompanyNameRequired");
      }
      if (!values.newCompanyCategorySelection) {
        errors.newCompanyCategorySelection = t("errors.newCompanyCategoryRequired");
      } else if (values.newCompanyCategorySelection === NEW_CATEGORY_SENTINEL) {
        if (values.newCategoryName.trim().length === 0) {
          errors.newCategoryName = t("errors.newCategoryNameRequired");
        }
        if (!values.newCategoryColor) {
          errors.newCategoryColor = t("errors.newCategoryColorRequired");
        }
      }
    }
    return errors;
  }

  function validateStep2(): Partial<Record<keyof CardFormValues, string>> {
    const errors: Partial<Record<keyof CardFormValues, string>> = {};
    if (values.type === CardType.limit) {
      const visits = Number(values.totalVisits);
      if (values.totalVisits === "") {
        errors.totalVisits = t("errors.totalVisitsRequiredForLimit");
      } else if (!(visits > 0)) {
        errors.totalVisits = t("errors.totalVisitsPositive");
      }
    } else if (values.expiryDate === "") {
      errors.expiryDate = t("errors.expiryDateRequiredForUnlimited");
    }
    return errors;
  }

  function validateStep3(): Partial<Record<keyof CardFormValues, string>> {
    const errors: Partial<Record<keyof CardFormValues, string>> = {};
    if (values.voucherInputMode === "file") {
      for (const file of values.voucherNewFiles) {
        if (!isAllowedVoucherContentType(file.type)) {
          errors.voucherNewFiles = t("errors.voucherFileTypeUnsupported");
          break;
        }
        if (file.size > VOUCHER_FILE_MAX_BYTES) {
          errors.voucherNewFiles = t("errors.voucherFileTooLarge");
          break;
        }
      }
    }
    return errors;
  }

  function goNext() {
    const errors = step === 1 ? validateStep1() : step === 2 ? validateStep2() : {};
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  }

  function goBack() {
    setFieldErrors({});
    if (step === 1) {
      onCancel();
    } else {
      setStep(step - 1);
    }
  }

  function handleFinalSubmit() {
    const errors = validateStep3();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onSubmit(values);
  }

  const selectedCompanyName =
    values.companyMode === "existing"
      ? (companies.find((company) => company.id === values.companyId)?.name ?? "")
      : values.newCompanyName;

  const selectedCategory =
    values.companyMode === "new"
      ? categories.find((category) => category.id === values.newCompanyCategorySelection)
      : undefined;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-0px)] w-full max-w-2xl flex-col px-4 pt-4 pb-6 md:min-h-0">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          aria-label={t("backAria")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-sm font-medium text-foreground/60">{t("stepLabel", { step })}</span>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-full px-3 text-sm font-medium text-foreground/60 hover:bg-black/5 dark:hover:bg-white/10"
        >
          {t("cancelButton")}
        </button>
      </div>

      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-mint transition-all"
              style={{ width: index < step ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex-1">
        {step === 1 && (
          <CompanyStep
            values={values}
            setValues={setValues}
            submitting={submitting}
            companies={companies}
            categories={categories}
            fieldErrors={fieldErrors}
          />
        )}
        {step === 2 && (
          <TypeStep
            values={values}
            setValues={setValues}
            submitting={submitting}
            companies={companies}
            categories={categories}
            fieldErrors={fieldErrors}
            companyName={selectedCompanyName}
            categoryName={selectedCategory ? categoryDisplayName(selectedCategory, tCategory) : null}
          />
        )}
        {step === 3 && (
          <VoucherStep
            values={values}
            setValues={setValues}
            submitting={submitting}
            companies={companies}
            categories={categories}
            fieldErrors={fieldErrors}
          />
        )}
      </div>

      {serverErrors.length > 0 && (
        <p className="mt-3 text-sm text-status-urgent">{t("errors.saveFailed")}</p>
      )}

      <div className="sticky bottom-0 mt-6 bg-background pt-2">
        <Button
          type="button"
          disabled={submitting}
          onClick={step === TOTAL_STEPS ? handleFinalSubmit : goNext}
          className="w-full justify-center py-3.5 text-base"
        >
          {step === TOTAL_STEPS ? (submitting ? t("savingButton") : t("saveButton")) : t("nextButton")}
        </Button>
      </div>
    </div>
  );
}
