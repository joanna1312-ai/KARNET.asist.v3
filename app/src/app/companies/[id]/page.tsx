"use client";

import { Ticket } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  CardForm,
  CardFormValues,
  CategoryOption,
  emptyCardFormValues,
  voucherFileUrlForSave,
} from "@/components/CardForm";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CompanyMap } from "@/components/CompanyMap";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { categoryDisplayName } from "@/lib/category-display";
import { deviceFetch } from "@/lib/device-client";
import { formatDate } from "@/lib/format";
import { uploadVoucherFile } from "@/lib/voucher-upload";
import { CardInputErrorCode } from "@/server/card-rules";
import { getCardWarningStatus } from "@/server/card-status";

interface ApiCompany {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  category: CategoryOption;
}

interface ApiCard {
  id: string;
  type: CardType;
  totalVisits: number | null;
  usedVisits: number;
  expiryDate: string | null;
  voucherMode: VoucherMode;
}

type FetchResult =
  | { status: "ok"; company: ApiCompany; cards: ApiCard[] }
  | { status: "not_found" }
  | { status: "error" };

async function fetchCompany(id: string): Promise<FetchResult> {
  try {
    const response = await deviceFetch(`/api/companies/${id}`);
    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "error" };
    const body: { company: ApiCompany; cards: ApiCard[] } = await response.json();
    return { status: "ok", company: body.company, cards: body.cards };
  } catch {
    return { status: "error" };
  }
}

async function fetchCategories(): Promise<CategoryOption[]> {
  const response = await deviceFetch("/api/categories");
  if (!response.ok) return [];
  const body: { categories: CategoryOption[] } = await response.json();
  return body.categories;
}

export default function CompanyDetailsPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  const [company, setCompany] = useState<ApiCompany | null>(null);
  const [cards, setCards] = useState<ApiCard[] | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<CardInputErrorCode[]>([]);
  const [voucherUploadError, setVoucherUploadError] = useState(false);

  const reload = useCallback(async () => {
    const result = await fetchCompany(companyId);
    if (result.status === "ok") {
      setCompany(result.company);
      setCards(result.cards);
      setLoadError(false);
      setNotFound(false);
    } else if (result.status === "not_found") {
      setNotFound(true);
    } else {
      setLoadError(true);
    }
  }, [companyId]);

  useEffect(() => {
    let ignore = false;

    fetchCompany(companyId).then((result) => {
      if (ignore) return;
      if (result.status === "ok") {
        setCompany(result.company);
        setCards(result.cards);
        setLoadError(false);
        setNotFound(false);
      } else if (result.status === "not_found") {
        setNotFound(true);
      } else {
        setLoadError(true);
      }
    });

    fetchCategories().then((result) => {
      if (!ignore) setCategories(result);
    });

    return () => {
      ignore = true;
    };
  }, [companyId]);

  function openAddForm() {
    setServerErrors([]);
    setVoucherUploadError(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setServerErrors([]);
  }

  async function handleFormSubmit(values: CardFormValues) {
    setSubmitting(true);
    setServerErrors([]);
    setVoucherUploadError(false);

    const payload = {
      companyId: values.companyId,
      type: values.type,
      totalVisits: values.totalVisits === "" ? null : Number(values.totalVisits),
      expiryDate: values.expiryDate === "" ? null : values.expiryDate,
      voucherMode: values.voucherMode,
      voucherFileUrl: voucherFileUrlForSave(values),
    };

    const response = await deviceFetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setSubmitting(false);
      const body: { errors?: CardInputErrorCode[] } = await response
        .json()
        .catch(() => ({}));
      setServerErrors(body.errors ?? []);
      return;
    }

    const savedBody: { card: { id: string } } = await response.json();

    // Upload pliku vouchera (Sesja V4.3) — patrz analogiczny komentarz w cards/page.tsx.
    if (values.voucherInputMode === "file" && values.voucherFile) {
      const uploaded = await uploadVoucherFile(savedBody.card.id, values.voucherFile);
      if (!uploaded) setVoucherUploadError(true);
    }

    setSubmitting(false);
    closeForm();
    await reload();
  }

  const t = useTranslations("companyDetailsPage");
  const tCategory = useTranslations("companyCategory");
  const tCardDetails = useTranslations("cardDetailsPage");

  if (notFound) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
        <p className="text-sm text-status-urgent">{t("notFound")}</p>
        <Link href="/companies" className="text-sm font-medium hover:underline">
          {t("backLink")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/companies" className="text-sm font-medium hover:underline">
        {t("backLink")}
      </Link>

      {loadError && <p className="text-sm text-status-urgent">{t("loadError")}</p>}
      {voucherUploadError && (
        <p className="text-sm text-status-urgent">{t("voucherUploadFailed")}</p>
      )}

      {company && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold">{company.name}</h1>
              <p className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <CategoryIcon slug={company.category.slug} color={company.category.color} />
                {categoryDisplayName(company.category, tCategory)}
              </p>
            </div>
            {!formOpen && (
              <Button type="button" onClick={openAddForm} className="shrink-0">
                {t("addCardButton")}
              </Button>
            )}
          </div>

          {/* Mapa lokalizacji (Sesja V4.1, ADR-004) — tylko dla firm dodanych przez
              wyszukiwanie Google Places; firmy dodane ręcznie wcześniej nie mają
              lat/lng, więc mapa po prostu się nie renderuje, bez błędu. */}
          {company.lat != null && company.lng != null && (
            <CompanyMap lat={company.lat} lng={company.lng} />
          )}

          {formOpen && (
            <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <CardForm
                mode="add"
                companies={[{ id: company.id, name: company.name }]}
                categories={categories}
                initialValues={{
                  ...emptyCardFormValues,
                  companyMode: "existing",
                  companyId: company.id,
                }}
                submitting={submitting}
                serverErrors={serverErrors}
                onSubmit={handleFormSubmit}
                onCancel={closeForm}
              />
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold">{t("cardsTitle")}</h2>
            {cards !== null && cards.length === 0 && (
              <EmptyState icon={Ticket} className="mt-2">
                {t("emptyState")}
              </EmptyState>
            )}

            {cards !== null && cards.length > 0 && (
              <ul className="mt-3 flex flex-col gap-3">
                {cards.map((card) => (
                  <li key={card.id}>
                    <Link
                      href={`/cards/${card.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <StatusBadge
                          status={getCardWarningStatus({
                            type: card.type,
                            totalVisits: card.totalVisits,
                            usedVisits: card.usedVisits,
                            expiryDate: card.expiryDate ? new Date(card.expiryDate) : null,
                          })}
                        />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {card.type === CardType.limit && card.totalVisits != null
                            ? tCardDetails("limitCounter", {
                                used: card.usedVisits,
                                total: card.totalVisits,
                              })
                            : tCardDetails("unlimitedLabel")}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {card.expiryDate
                          ? tCardDetails("expiryLabel", { date: formatDate(card.expiryDate) })
                          : tCardDetails("noExpiryLabel")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
