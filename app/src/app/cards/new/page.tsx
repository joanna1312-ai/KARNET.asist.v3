"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CardFormValues,
  CategoryOption,
  CompanyOption,
  NEW_CATEGORY_SENTINEL,
  voucherFileUrlForSave,
} from "@/components/CardForm";
import { CardWizard } from "@/components/CardWizard";
import { deviceFetch } from "@/lib/device-client";
import { uploadVoucherFiles } from "@/lib/voucher-upload";
import { CardInputErrorCode } from "@/server/card-rules";

export default function NewCardPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<CardInputErrorCode[]>([]);

  useEffect(() => {
    let ignore = false;

    Promise.all([deviceFetch("/api/companies"), deviceFetch("/api/categories")])
      .then(async ([companiesRes, categoriesRes]) => {
        if (ignore || !companiesRes.ok || !categoriesRes.ok) return;
        const companiesBody: { companies: CompanyOption[] } = await companiesRes.json();
        const categoriesBody: { categories: CategoryOption[] } = await categoriesRes.json();
        setCompanies(companiesBody.companies);
        setCategories(categoriesBody.categories);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  // Ta sama orkiestracja co handleFormSubmit w cards/page.tsx (nowa firma/kategoria
  // powstają osobnymi wywołaniami przed właściwym POST /api/cards) — kreator na końcu
  // woła dokładnie ten sam pipeline, żeby zachować spójność z formularzem desktopowym.
  async function handleSubmit(values: CardFormValues) {
    setSubmitting(true);
    setServerErrors([]);

    let companyId = values.companyId;

    if (values.companyMode === "new") {
      let categoryId = values.newCompanyCategorySelection;

      if (categoryId === NEW_CATEGORY_SENTINEL) {
        const categoryResponse = await deviceFetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.newCategoryName.trim(),
            color: values.newCategoryColor,
          }),
        });

        if (!categoryResponse.ok) {
          setSubmitting(false);
          setServerErrors(["companyRequired"]);
          return;
        }

        const categoryBody: { category: CategoryOption } = await categoryResponse.json();
        categoryId = categoryBody.category.id;
        setCategories((prev) => [...prev, categoryBody.category]);
      }

      const companyResponse = await deviceFetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.newCompanyName.trim(),
          categoryId,
          lat: values.newCompanyLat,
          lng: values.newCompanyLng,
          googlePlaceId: values.newCompanyGooglePlaceId,
          address: values.newCompanyAddress,
        }),
      });

      if (!companyResponse.ok) {
        setSubmitting(false);
        setServerErrors(["companyRequired"]);
        return;
      }

      const companyBody: { company: CompanyOption } = await companyResponse.json();
      companyId = companyBody.company.id;
      setCompanies((prev) => [...prev, companyBody.company].sort((a, b) => a.name.localeCompare(b.name)));
    }

    const payload = {
      companyId,
      type: values.type,
      totalVisits: values.totalVisits === "" ? null : Number(values.totalVisits),
      expiryDate: values.expiryDate === "" ? null : values.expiryDate,
      voucherFileUrl: voucherFileUrlForSave(values),
    };

    const response = await deviceFetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setSubmitting(false);
      const body: { errors?: CardInputErrorCode[] } = await response.json().catch(() => ({}));
      setServerErrors(body.errors ?? []);
      return;
    }

    const savedBody: { card: { id: string } } = await response.json();

    if (values.voucherNewFiles.length > 0) {
      await uploadVoucherFiles(savedBody.card.id, values.voucherNewFiles);
    }

    setSubmitting(false);
    router.push("/cards");
  }

  return (
    <CardWizard
      companies={companies}
      categories={categories}
      submitting={submitting}
      serverErrors={serverErrors}
      onSubmit={handleSubmit}
      onCancel={() => router.push("/cards")}
    />
  );
}
