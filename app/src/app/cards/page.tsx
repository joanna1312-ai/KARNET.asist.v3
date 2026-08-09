"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CardForm,
  CardFormValues,
  CategoryOption,
  CompanyOption,
  emptyCardFormValues,
  NEW_CATEGORY_SENTINEL,
  voucherFileUrlForSave,
} from "@/components/CardForm";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { deviceFetch } from "@/lib/device-client";
import { formatDate } from "@/lib/format";
import { categoryDisplayName } from "@/lib/category-display";
import { uploadVoucherFile } from "@/lib/voucher-upload";
import { CardInputErrorCode } from "@/server/card-rules";
import { getCardWarningStatus } from "@/server/card-status";
import type { CategoryColor } from "@/server/system-categories";
import { isStorageVoucherFileUrl } from "@/server/voucher-file";

interface ApiCategory {
  id: string;
  slug: string | null;
  name: string;
  color: CategoryColor;
  isSystem: boolean;
}

interface ApiCard {
  id: string;
  type: CardType;
  totalVisits: number | null;
  usedVisits: number;
  expiryDate: string | null;
  voucherMode: VoucherMode;
  voucherFileUrl: string | null;
  company: { id: string; name: string; category: ApiCategory };
}

function cardToFormValues(card: ApiCard): CardFormValues {
  return {
    companyMode: "existing",
    companyId: card.company.id,
    newCompanyName: "",
    newCompanyLat: null,
    newCompanyLng: null,
    newCompanyGooglePlaceId: null,
    newCompanyCategorySelection: "",
    newCategoryName: "",
    newCategoryColor: "",
    type: card.type,
    totalVisits: card.totalVisits != null ? String(card.totalVisits) : "",
    expiryDate: card.expiryDate ? card.expiryDate.slice(0, 10) : "",
    voucherMode: card.voucherMode,
    voucherFileUrl: card.voucherFileUrl ?? "",
    voucherInputMode: isStorageVoucherFileUrl(card.voucherFileUrl) ? "file" : "text",
    voucherFile: null,
    voucherRemoveFile: false,
  };
}

// Do "Odnów" z archiwum: ta sama firma/typ/liczba wejść/voucher co karnet źródłowy, ale
// bez daty ważności — karnet trafił do archiwum właśnie przez upłynięcie starej daty (lub
// wyczerpanie limitu), więc nowa musi zostać świadomie podana od nowa.
function renewFormValues(card: ApiCard): CardFormValues {
  return { ...cardToFormValues(card), expiryDate: "" };
}

type CardsTab = "active" | "archived";

async function fetchCardsAndCompanies(tab: CardsTab): Promise<{
  companies: CompanyOption[];
  categories: CategoryOption[];
  cards: ApiCard[];
}> {
  const [companiesRes, categoriesRes, cardsRes] = await Promise.all([
    deviceFetch("/api/companies"),
    deviceFetch("/api/categories"),
    deviceFetch(tab === "archived" ? "/api/cards?archived=true" : "/api/cards"),
  ]);
  if (!companiesRes.ok || !categoriesRes.ok || !cardsRes.ok) throw new Error("load_failed");
  const companiesBody: { companies: CompanyOption[] } = await companiesRes.json();
  const categoriesBody: { categories: CategoryOption[] } = await categoriesRes.json();
  const cardsBody: { cards: ApiCard[] } = await cardsRes.json();
  return {
    companies: companiesBody.companies,
    categories: categoriesBody.categories,
    cards: cardsBody.cards,
  };
}

export default function CardsPage() {
  const [tab, setTab] = useState<CardsTab>("active");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [cards, setCards] = useState<ApiCard[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ApiCard | null>(null);
  const [renewSource, setRenewSource] = useState<ApiCard | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<CardInputErrorCode[]>([]);
  const [voucherUploadError, setVoucherUploadError] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ApiCard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const reload = useCallback(async (forTab: CardsTab = tab) => {
    try {
      const data = await fetchCardsAndCompanies(forTab);
      setCompanies(data.companies);
      setCategories(data.categories);
      setCards(data.cards);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [tab]);

  useEffect(() => {
    let ignore = false;

    fetchCardsAndCompanies(tab)
      .then((data) => {
        if (ignore) return;
        setCompanies(data.companies);
        setCategories(data.categories);
        setCards(data.cards);
        setLoadError(false);
      })
      .catch(() => {
        if (!ignore) setLoadError(true);
      });

    return () => {
      ignore = true;
    };
  }, [tab]);

  function openAddForm() {
    setEditingCard(null);
    setRenewSource(null);
    setServerErrors([]);
    setVoucherUploadError(false);
    setFormOpen(true);
  }

  function openEditForm(card: ApiCard) {
    setEditingCard(card);
    setRenewSource(null);
    setServerErrors([]);
    setVoucherUploadError(false);
    setFormOpen(true);
  }

  function openRenewForm(card: ApiCard) {
    setEditingCard(null);
    setRenewSource(card);
    setServerErrors([]);
    setVoucherUploadError(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCard(null);
    setRenewSource(null);
    setServerErrors([]);
  }

  async function handleFormSubmit(values: CardFormValues) {
    setSubmitting(true);
    setServerErrors([]);
    setVoucherUploadError(false);

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
          // Sentinel: CardForm nie renderuje selecta firmy w trybie "new", więc to
          // tylko odpala generyczny komunikat "Nie udało się zapisać" (errors.saveFailed),
          // nie podświetla żadnego konkretnego pola.
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
        }),
      });

      if (!companyResponse.ok) {
        setSubmitting(false);
        // Sentinel: CardForm nie renderuje selecta firmy w trybie "new", więc to
        // tylko odpala generyczny komunikat "Nie udało się zapisać" (errors.saveFailed),
        // nie podświetla żadnego konkretnego pola.
        setServerErrors(["companyRequired"]);
        return;
      }

      const companyBody: { company: CompanyOption } = await companyResponse.json();
      companyId = companyBody.company.id;
      setCompanies((prev) =>
        [...prev, companyBody.company].sort((a, b) => a.name.localeCompare(b.name))
      );
    }

    const payload = {
      companyId,
      type: values.type,
      totalVisits: values.totalVisits === "" ? null : Number(values.totalVisits),
      expiryDate: values.expiryDate === "" ? null : values.expiryDate,
      voucherMode: values.voucherMode,
      voucherFileUrl: voucherFileUrlForSave(values),
    };

    const response = editingCard
      ? await deviceFetch(`/api/cards/${editingCard.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await deviceFetch("/api/cards", {
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

    // Upload pliku vouchera (Sesja V4.3) — osobne wywołanie PO zapisaniu karnetu, bo
    // endpoint uploadu potrzebuje już istniejącego id karnetu. Niepowodzenie tu nie cofa
    // zapisu karnetu — pokazujemy nieblokujący komunikat, plik da się dograć w edycji.
    if (values.voucherInputMode === "file" && values.voucherFile) {
      const uploaded = await uploadVoucherFile(savedBody.card.id, values.voucherFile);
      if (!uploaded) setVoucherUploadError(true);
    }

    setSubmitting(false);

    const wasRenewing = renewSource !== null;
    closeForm();

    if (wasRenewing) {
      // Nowy karnet jest aktywny, choćby odnawiany był z zakładki Archiwum —
      // pokaż go tam, gdzie faktycznie wyląduje.
      setTab("active");
      await reload("active");
    } else {
      await reload();
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(false);

    const response = await deviceFetch(`/api/cards/${deleteTarget.id}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!response.ok) {
      setDeleteError(true);
      return;
    }

    setDeleteTarget(null);
    await reload();
  }

  const t = useTranslations("cardsPage");
  const tDetails = useTranslations("cardDetailsPage");
  const tDeleteDialog = useTranslations("deleteCardDialog");
  const tCategory = useTranslations("companyCategory");

  const groupedCards = useMemo(() => {
    if (!cards) return [];
    const byCategory = new Map<string, { category: ApiCategory; cards: ApiCard[] }>();
    for (const card of cards) {
      const category = card.company.category;
      const group = byCategory.get(category.id);
      if (group) {
        group.cards.push(card);
      } else {
        byCategory.set(category.id, { category, cards: [card] });
      }
    }
    return [...byCategory.values()].sort((a, b) =>
      categoryDisplayName(a.category, tCategory).localeCompare(
        categoryDisplayName(b.category, tCategory)
      )
    );
  }, [cards, tCategory]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 text-2xl font-semibold">{t("title")}</h1>
        <Button type="button" onClick={openAddForm}>
          {t("addButton")}
        </Button>
      </div>

      <div className="flex w-fit gap-1 rounded-full border border-black/10 p-1 dark:border-white/10">
        {(["active", "archived"] as const).map((tabOption) => (
          <Button
            key={tabOption}
            type="button"
            variant={tab === tabOption ? "primary" : "ghost"}
            onClick={() => setTab(tabOption)}
          >
            {t(tabOption === "active" ? "tabActive" : "tabArchived")}
          </Button>
        ))}
      </div>

      {formOpen && (
        <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <CardForm
            mode={editingCard ? "edit" : renewSource ? "renew" : "add"}
            companies={companies}
            categories={categories}
            initialValues={
              editingCard
                ? cardToFormValues(editingCard)
                : renewSource
                  ? renewFormValues(renewSource)
                  : emptyCardFormValues
            }
            submitting={submitting}
            serverErrors={serverErrors}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        </div>
      )}

      {loadError && <p className="text-sm text-status-urgent">{t("loadError")}</p>}
      {voucherUploadError && (
        <p className="text-sm text-status-urgent">{t("voucherUploadFailed")}</p>
      )}

      {cards === null && !loadError && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">…</p>
      )}

      {cards !== null && cards.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t(tab === "archived" ? "archiveEmptyState" : "emptyState")}
        </p>
      )}

      {cards !== null && cards.length > 0 && (
        <div className="flex flex-col gap-6">
          {groupedCards.map(({ category, cards: categoryCards }) => (
            <div key={category.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5 px-1">
                <CategoryIcon slug={category.slug} color={category.color} />
                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  {categoryDisplayName(category, tCategory)}
                </h2>
              </div>
              <ul className="flex flex-col gap-3">
                {categoryCards.map((card) => (
                  <li
                    key={card.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/10"
                  >
                    <Link href={`/cards/${card.id}`} className="min-w-0 flex-1 hover:underline">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="min-w-0 truncate font-medium">{card.company.name}</p>
                        <StatusBadge
                          status={getCardWarningStatus({
                            type: card.type,
                            totalVisits: card.totalVisits,
                            usedVisits: card.usedVisits,
                            expiryDate: card.expiryDate ? new Date(card.expiryDate) : null,
                          })}
                        />
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {card.type === CardType.limit && card.totalVisits != null
                          ? tDetails("limitCounter", {
                              used: card.usedVisits,
                              total: card.totalVisits,
                            })
                          : tDetails("unlimitedLabel")}
                        {" · "}
                        {card.expiryDate
                          ? tDetails("expiryLabel", { date: formatDate(card.expiryDate) })
                          : tDetails("noExpiryLabel")}
                      </p>
                    </Link>
                    <div className="flex shrink-0 gap-2">
                      {tab === "archived" ? (
                        <Button type="button" variant="ghost" onClick={() => openRenewForm(card)}>
                          {t("renewButton")}
                        </Button>
                      ) : (
                        <Button type="button" variant="ghost" onClick={() => openEditForm(card)}>
                          {t("editButton")}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => {
                          setDeleteError(false);
                          setDeleteTarget(card);
                        }}
                      >
                        {t("deleteButton")}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={tDeleteDialog("title")}
        body={deleteError ? tDeleteDialog("deleteFailed") : tDeleteDialog("body")}
        confirmLabel={tDeleteDialog("confirmButton")}
        cancelLabel={tDeleteDialog("cancelButton")}
        confirmDisabled={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
