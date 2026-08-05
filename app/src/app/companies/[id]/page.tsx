"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { CardForm, CardFormValues, emptyCardFormValues } from "@/components/CardForm";
import { StatusBadge } from "@/components/StatusBadge";
import { CardType, CompanyCategory, VoucherMode } from "@/generated/prisma/enums";
import { deviceFetch } from "@/lib/device-client";
import { formatDate } from "@/lib/format";
import { CardInputErrorCode } from "@/server/card-rules";
import { getCardWarningStatus } from "@/server/card-status";

interface ApiCompany {
  id: string;
  name: string;
  category: CompanyCategory;
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

export default function CompanyDetailsPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  const [company, setCompany] = useState<ApiCompany | null>(null);
  const [cards, setCards] = useState<ApiCard[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<CardInputErrorCode[]>([]);

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

    return () => {
      ignore = true;
    };
  }, [companyId]);

  function openAddForm() {
    setServerErrors([]);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setServerErrors([]);
  }

  async function handleFormSubmit(values: CardFormValues) {
    setSubmitting(true);
    setServerErrors([]);

    const payload = {
      companyId: values.companyId,
      type: values.type,
      totalVisits: values.totalVisits === "" ? null : Number(values.totalVisits),
      expiryDate: values.expiryDate === "" ? null : values.expiryDate,
      voucherMode: values.voucherMode,
      voucherFileUrl: values.voucherFileUrl.trim() === "" ? null : values.voucherFileUrl.trim(),
    };

    const response = await deviceFetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!response.ok) {
      const body: { errors?: CardInputErrorCode[] } = await response
        .json()
        .catch(() => ({}));
      setServerErrors(body.errors ?? []);
      return;
    }

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

      {company && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{company.name}</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {tCategory(company.category)}
              </p>
            </div>
            {!formOpen && (
              <button
                type="button"
                onClick={openAddForm}
                className="rounded-full bg-mint px-4 py-2 text-sm font-semibold text-mint-ink hover:brightness-95"
              >
                {t("addCardButton")}
              </button>
            )}
          </div>

          {formOpen && (
            <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <CardForm
                mode="add"
                companies={[{ id: company.id, name: company.name }]}
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
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {t("emptyState")}
              </p>
            )}

            {cards !== null && cards.length > 0 && (
              <ul className="mt-3 flex flex-col gap-3">
                {cards.map((card) => (
                  <li key={card.id}>
                    <Link
                      href={`/cards/${card.id}`}
                      className="flex items-center justify-between rounded-2xl border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2">
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
