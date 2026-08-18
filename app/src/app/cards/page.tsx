"use client";

import { Archive, Ticket } from "lucide-react";
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
import { ArchivedCardItem } from "@/components/ArchivedCardItem";
import { CardListItem } from "@/components/CardListItem";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { deviceFetch } from "@/lib/device-client";
import { categoryDisplayName } from "@/lib/category-display";
import {
  deleteVoucherFile,
  fetchVoucherFiles,
  uploadVoucherFiles,
  type VoucherFile,
} from "@/lib/voucher-upload";
import { CardInputErrorCode } from "@/server/card-rules";
import type { CategoryColor } from "@/server/system-categories";

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

// `existingFiles` puste dla "Odnów" (Sesja V6.2: nowy karnet zaczyna bez plików —
// świadoma decyzja, patrz DECISIONS.md) i dla świeżo otwartej edycji przed dociągnięciem
// listy z GET /api/cards/:id/voucher-files.
function cardToFormValues(card: ApiCard, existingFiles: VoucherFile[]): CardFormValues {
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
    voucherInputMode: existingFiles.length > 0 ? "file" : "text",
    voucherExistingFiles: existingFiles,
    voucherFilesToRemove: [],
    voucherNewFiles: [],
  };
}

// Do "Odnów" z archiwum: ta sama firma/typ/liczba wejść/tekst vouchera co karnet
// źródłowy, ale bez daty ważności — karnet trafił do archiwum właśnie przez upłynięcie
// starej daty (lub wyczerpanie limitu), więc nowa musi zostać świadomie podana od nowa.
// Pliki vouchera (Sesja V6.2) świadomie NIE są dziedziczone — nowy karnet zaczyna bez nich.
function renewFormValues(card: ApiCard): CardFormValues {
  return { ...cardToFormValues(card, []), expiryDate: "" };
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
  const [editingVoucherFiles, setEditingVoucherFiles] = useState<VoucherFile[]>([]);
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

  // Aktualizacja optymistyczna licznika po "+1"/cofnięciu z listy (Etap 2) — bez
  // pełnego refetchu, żeby akcja była natychmiastowa; pełne dane wracają dopiero
  // przy kolejnym reload() (np. karnet, który właśnie wyczerpał limit, zniknie
  // z aktywnych dopiero wtedy, nie w trakcie okna "Cofnij").
  function handleVisitCountChange(cardId: string, delta: 1 | -1) {
    setCards((prev) =>
      prev
        ? prev.map((card) =>
            card.id === cardId ? { ...card, usedVisits: card.usedVisits + delta } : card
          )
        : prev
    );
  }

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

  const openAddForm = useCallback(() => {
    setEditingCard(null);
    setEditingVoucherFiles([]);
    setRenewSource(null);
    setServerErrors([]);
    setVoucherUploadError(false);
    setFormOpen(true);
  }, []);

  // Async: pliki karnetu (Sesja V6.2) muszą być pobrane PRZED otwarciem formularza — jego
  // wewnętrzny stan startowy (useState(initialValues)) czyta initialValues tylko raz, przy
  // montowaniu, więc dociągnięcie ich po fakcie by ich nie pokazało.
  async function openEditForm(card: ApiCard) {
    setServerErrors([]);
    setVoucherUploadError(false);
    const files = await fetchVoucherFiles(card.id);
    setEditingCard(card);
    setEditingVoucherFiles(files);
    setRenewSource(null);
    setFormOpen(true);
  }

  function openRenewForm(card: ApiCard) {
    setEditingCard(null);
    setEditingVoucherFiles([]);
    setRenewSource(card);
    setServerErrors([]);
    setVoucherUploadError(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCard(null);
    setEditingVoucherFiles([]);
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

    // Usuwanie/upload plików vouchera (Sesja V4.3, rozszerzone o wiele plików w Sesji
    // V6.2) — osobne wywołania PO zapisaniu karnetu, bo endpointy potrzebują już
    // istniejącego id karnetu. Niepowodzenie tu nie cofa zapisu karnetu — pokazujemy
    // nieblokujący komunikat, pliki da się poprawić w edycji. Niezależne od
    // voucherInputMode (który steruje tylko tym, która karta jest widoczna) — usunięcia/
    // dodania z listy plików zapisują się niezależnie od tego, czy w danej chwili widać
    // kartę "tekst" czy "pliki".
    let voucherFilesFailed = false;
    for (const fileId of values.voucherFilesToRemove) {
      const removed = await deleteVoucherFile(savedBody.card.id, fileId);
      if (!removed) voucherFilesFailed = true;
    }
    if (values.voucherNewFiles.length > 0) {
      const failedCount = await uploadVoucherFiles(savedBody.card.id, values.voucherNewFiles);
      if (failedCount > 0) voucherFilesFailed = true;
    }
    if (voucherFilesFailed) setVoucherUploadError(true);

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-4 pb-10 md:gap-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Logo size="sm" className="mb-1 opacity-60" />
          <h1 className="font-brand text-[27px] leading-[1.15] font-extrabold tracking-[-0.02em]">
            {t("title")}
          </h1>
        </div>
        {/* Mobile: dodawanie karnetu idzie przez FAB w BottomTabBar (wariant 1b). Owinięte w
        div zamiast "hidden" bezpośrednio na Button — Button ma wbudowane "inline-flex" o tej
        samej specyficzności co "hidden", więc nadpisanie klasą nie działałoby niezawodnie. */}
        <div className="hidden shrink-0 md:block">
          <Button type="button" onClick={openAddForm}>
            {t("addButton")}
          </Button>
        </div>
      </div>

      <div className="flex w-fit gap-1 rounded-full bg-black/5 p-1 dark:bg-white/10">
        {(["active", "archived"] as const).map((tabOption) => (
          <button
            key={tabOption}
            type="button"
            onClick={() => setTab(tabOption)}
            className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
              tab === tabOption
                ? "bg-foreground text-background"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {t(tabOption === "active" ? "tabActive" : "tabArchived")}
          </button>
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
                ? cardToFormValues(editingCard, editingVoucherFiles)
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
        <div className="flex flex-col gap-3" aria-hidden>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-[76px] animate-pulse rounded-[20px] bg-black/5 dark:bg-white/5"
            />
          ))}
        </div>
      )}

      {cards !== null && cards.length === 0 && (
        <EmptyState icon={tab === "archived" ? Archive : Ticket}>
          {t(tab === "archived" ? "archiveEmptyState" : "emptyState")}
        </EmptyState>
      )}

      {cards !== null && cards.length > 0 && tab === "active" && (
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
                  <CardListItem
                    key={card.id}
                    card={card}
                    onVisitCountChange={handleVisitCountChange}
                    onEdit={() => openEditForm(card)}
                    onDelete={() => {
                      setDeleteError(false);
                      setDeleteTarget(card);
                    }}
                    onCardLikelyArchived={() => reload()}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {cards !== null && cards.length > 0 && tab === "archived" && (
        <>
          <ul className="flex flex-col gap-3">
            {cards.map((card) => (
              <ArchivedCardItem key={card.id} card={card} onRenew={() => openRenewForm(card)} />
            ))}
          </ul>
          <p className="px-1 text-sm text-foreground/50">{t("archiveHint")}</p>
        </>
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
