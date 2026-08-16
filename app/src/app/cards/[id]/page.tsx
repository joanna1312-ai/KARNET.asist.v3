"use client";

import { ChevronLeft, Ellipsis, History, Pencil, Plus, Ticket } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CardForm,
  CardFormValues,
  CategoryOption,
  CompanyOption,
  voucherFileUrlForSave,
} from "@/components/CardForm";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { VisitDots } from "@/components/VisitDots";
import { Button } from "@/components/ui/Button";
import { CARD_SURFACE_CLASS } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { emptyVisitFormValues, VisitForm, VisitFormValues } from "@/components/VisitForm";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { categoryDisplayName } from "@/lib/category-display";
import { deviceFetch } from "@/lib/device-client";
import { formatDate, formatDayMonthShort, formatTime, formatWeekday } from "@/lib/format";
import { CardInputErrorCode } from "@/server/card-rules";
import { getCardWarningStatus, isCardArchived } from "@/server/card-status";
import { uploadVoucherFile } from "@/lib/voucher-upload";
import type { CategoryColor } from "@/server/system-categories";
import {
  isStorageVoucherFileUrl,
  voucherFileKindFromPath,
  voucherStoragePath,
} from "@/server/voucher-file";
import { VisitInputErrorCode } from "@/server/visit-rules";

interface ApiVisit {
  id: string;
  visitDate: string;
  visitTime: string | null;
  note: string | null;
}

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
  visits: ApiVisit[];
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

function visitToFormValues(visit: ApiVisit): VisitFormValues {
  return {
    visitDate: visit.visitDate.slice(0, 10),
    visitTime: visit.visitTime ? visit.visitTime.slice(11, 16) : "",
    note: visit.note ?? "",
  };
}

// Podgląd pliku vouchera wgranego do Supabase Storage (Sesja V4.3, ADR-009) — bucket jest
// prywatny, więc zamiast trwałego linku pobieramy świeży podpisany URL przy każdym
// wejściu na stronę (endpoint sam sprawdza własność karnetu, jak reszta /api/cards/*).
function VoucherFilePreview({ cardId, voucherFileUrl }: { cardId: string; voucherFileUrl: string }) {
  const t = useTranslations("cardDetailsPage");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;
    setUrl(null);
    setError(false);

    deviceFetch(`/api/cards/${cardId}/voucher-file`)
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((body: { url: string }) => {
        if (!ignore) setUrl(body.url);
      })
      .catch(() => {
        if (!ignore) setError(true);
      });

    return () => {
      ignore = true;
    };
  }, [cardId, voucherFileUrl]);

  if (error) {
    return <p className="mt-1 text-sm text-status-urgent">{t("voucherLoadError")}</p>;
  }

  if (!url) {
    return <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("voucherLoading")}</p>;
  }

  if (voucherFileKindFromPath(voucherStoragePath(voucherFileUrl)) === "pdf") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-sm font-medium hover:underline"
      >
        {t("voucherOpenPdf")}
      </a>
    );
  }

  // Podpisany URL Supabase (wygasa po kilku minutach) nie jest znaną domeną na
  // build-time — next/image wymagałby remotePatterns dla efemerycznego hosta i tak nie
  // dałoby żadnej korzyści.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="mt-2 max-h-64 rounded-lg" />;
}

type FetchCardResult =
  | { status: "ok"; card: ApiCard }
  | { status: "not_found" }
  | { status: "error" };

async function fetchCard(cardId: string): Promise<FetchCardResult> {
  try {
    const response = await deviceFetch(`/api/cards/${cardId}`);
    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "error" };
    const body: { card: ApiCard } = await response.json();
    return { status: "ok", card: body.card };
  } catch {
    return { status: "error" };
  }
}

function CardActionsMenu({ onDelete }: { onDelete: () => void }) {
  const t = useTranslations("cardDetailsPage");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("moreActionsAria")}
        aria-expanded={open}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/5 text-foreground hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
      >
        <Ellipsis className="size-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute right-0 top-[calc(100%+0.5rem)] z-20 w-48 p-1.5 text-foreground shadow-xl ${CARD_SURFACE_CLASS}`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full min-h-11 items-center rounded-lg px-3 text-left text-sm font-medium text-status-urgent hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t("deleteCardMenuItem")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function CardDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const cardId = params.id;

  const [card, setCard] = useState<ApiCard | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<ApiVisit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<VisitInputErrorCode[]>([]);
  const [archivedError, setArchivedError] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ApiVisit | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [cardServerErrors, setCardServerErrors] = useState<CardInputErrorCode[]>([]);
  const [voucherUploadError, setVoucherUploadError] = useState(false);

  const [deleteCardOpen, setDeleteCardOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState(false);
  const [deleteCardError, setDeleteCardError] = useState(false);

  const reload = useCallback(async () => {
    const result = await fetchCard(cardId);
    if (result.status === "ok") {
      setCard(result.card);
      setLoadError(false);
      setNotFound(false);
    } else if (result.status === "not_found") {
      setNotFound(true);
    } else {
      setLoadError(true);
    }
  }, [cardId]);

  useEffect(() => {
    let ignore = false;

    fetchCard(cardId).then((result) => {
      if (ignore) return;
      if (result.status === "ok") {
        setCard(result.card);
        setLoadError(false);
        setNotFound(false);
      } else if (result.status === "not_found") {
        setNotFound(true);
      } else {
        setLoadError(true);
      }
    });

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
  }, [cardId]);

  function openAddForm() {
    setEditingVisit(null);
    setServerErrors([]);
    setArchivedError(false);
    setFormOpen(true);
  }

  function openEditForm(visit: ApiVisit) {
    setEditingVisit(visit);
    setServerErrors([]);
    setArchivedError(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingVisit(null);
    setServerErrors([]);
    setArchivedError(false);
  }

  async function handleFormSubmit(values: VisitFormValues) {
    setSubmitting(true);
    setServerErrors([]);
    setArchivedError(false);

    const payload = {
      visitDate: values.visitDate,
      visitTime: values.visitTime === "" ? null : values.visitTime,
      note: values.note.trim() === "" ? null : values.note.trim(),
    };

    const response = editingVisit
      ? await deviceFetch(`/api/cards/${cardId}/visits/${editingVisit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await deviceFetch(`/api/cards/${cardId}/visits`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSubmitting(false);

    if (response.status === 409) {
      setArchivedError(true);
      return;
    }

    if (!response.ok) {
      const body: { errors?: VisitInputErrorCode[] } = await response
        .json()
        .catch(() => ({}));
      setServerErrors(body.errors ?? []);
      return;
    }

    closeForm();
    await reload();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(false);

    const response = await deviceFetch(`/api/cards/${cardId}/visits/${deleteTarget.id}`, {
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

  async function handleCardFormSubmit(values: CardFormValues) {
    setCardSubmitting(true);
    setCardServerErrors([]);
    setVoucherUploadError(false);

    const payload = {
      companyId: values.companyId,
      type: values.type,
      totalVisits: values.totalVisits === "" ? null : Number(values.totalVisits),
      expiryDate: values.expiryDate === "" ? null : values.expiryDate,
      voucherMode: values.voucherMode,
      voucherFileUrl: voucherFileUrlForSave(values),
    };

    const response = await deviceFetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setCardSubmitting(false);
      const body: { errors?: CardInputErrorCode[] } = await response.json().catch(() => ({}));
      setCardServerErrors(body.errors ?? []);
      return;
    }

    if (values.voucherInputMode === "file" && values.voucherFile) {
      const uploaded = await uploadVoucherFile(cardId, values.voucherFile);
      if (!uploaded) setVoucherUploadError(true);
    }

    setCardSubmitting(false);
    setCardFormOpen(false);
    await reload();
  }

  async function handleConfirmDeleteCard() {
    setDeletingCard(true);
    setDeleteCardError(false);

    const response = await deviceFetch(`/api/cards/${cardId}`, { method: "DELETE" });

    setDeletingCard(false);

    if (!response.ok) {
      setDeleteCardError(true);
      return;
    }

    router.push("/cards");
  }

  const t = useTranslations("cardDetailsPage");
  const tCategory = useTranslations("companyCategory");
  const tDeleteDialog = useTranslations("deleteVisitDialog");
  const tDeleteCardDialog = useTranslations("deleteCardDialog");
  const tCardsPage = useTranslations("cardsPage");
  const tVisitForm = useTranslations("visitForm");

  const archived =
    card != null &&
    isCardArchived({
      type: card.type,
      totalVisits: card.totalVisits,
      usedVisits: card.usedVisits,
      expiryDate: card.expiryDate ? new Date(card.expiryDate) : null,
    });

  const status =
    card != null
      ? getCardWarningStatus({
          type: card.type,
          totalVisits: card.totalVisits,
          usedVisits: card.usedVisits,
          expiryDate: card.expiryDate ? new Date(card.expiryDate) : null,
        })
      : "ok";

  if (notFound) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
        <p className="text-sm text-status-urgent">{t("notFound")}</p>
        <Link href="/cards" className="text-sm font-medium hover:underline">
          {t("backLink")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-4 pb-10">
      <div className="flex items-center justify-between">
        <Link
          href="/cards"
          aria-label={t("backLink")}
          title={t("backLink")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ChevronLeft className="size-5" />
        </Link>
        {card && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setCardServerErrors([]);
                setVoucherUploadError(false);
                setCardFormOpen(true);
              }}
              aria-label={t("editCardAria")}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/5 text-foreground hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              <Pencil className="size-4" />
            </button>
            <CardActionsMenu
              onDelete={() => {
                setDeleteCardError(false);
                setDeleteCardOpen(true);
              }}
            />
          </div>
        )}
      </div>

      {loadError && <p className="text-sm text-status-urgent">{t("loadError")}</p>}

      {card && (
        <>
          <div className="flex items-center gap-3">
            <CategoryIcon slug={card.company.category.slug} color={card.company.category.color} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate font-brand text-2xl font-extrabold tracking-[-0.02em]">
                {card.company.name}
              </h1>
              <p className="text-sm text-foreground/60">
                {categoryDisplayName(card.company.category, tCategory)}
                {" · "}
                {card.expiryDate
                  ? t("expiryLabel", { date: formatDate(card.expiryDate) })
                  : t("noExpiryLabel")}
              </p>
            </div>
          </div>

          {cardFormOpen && (
            <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <CardForm
                mode="edit"
                companies={companies}
                categories={categories}
                initialValues={cardToFormValues(card)}
                submitting={cardSubmitting}
                serverErrors={cardServerErrors}
                onSubmit={handleCardFormSubmit}
                onCancel={() => setCardFormOpen(false)}
              />
              {voucherUploadError && (
                <p className="mt-3 text-sm text-status-urgent">{tCardsPage("voucherUploadFailed")}</p>
              )}
            </div>
          )}

          <div className={`rounded-[22px] p-5 ${CARD_SURFACE_CLASS}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-baseline gap-1.5">
                <span className="font-brand text-[30px] font-bold">{card.usedVisits}</span>
                <span className="text-lg font-semibold text-foreground/45">
                  {card.type === CardType.limit && card.totalVisits != null
                    ? `/ ${card.totalVisits} ${t("totalVisitsSuffix")}`
                    : t("unlimitedLabel")}
                </span>
              </p>
              <StatusBadge status={status} />
            </div>

            <div className="mt-3">
              <VisitDots
                used={card.usedVisits}
                total={card.totalVisits}
                unlimited={card.type !== CardType.limit}
                color={card.company.category.color}
                size="lg"
                highlightLast
              />
            </div>

            {!archived && (
              <Button
                type="button"
                onClick={openAddForm}
                className="mt-4 w-full justify-center gap-2 bg-mint text-mint-ink hover:bg-mint"
              >
                <Plus className="size-4" aria-hidden />
                {t("saveVisitButton")}
              </Button>
            )}

            {archived && (
              <p className="mt-3 text-sm text-foreground/60">{t("archivedNotice")}</p>
            )}
          </div>

          {card.voucherFileUrl && (
            <div className={`p-4 ${CARD_SURFACE_CLASS}`}>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coral/25 text-coral-ink">
                  <Ticket className="size-4" aria-hidden />
                </span>
                <h2 className="text-sm font-semibold">{t("voucherLabel")}</h2>
              </div>
              {isStorageVoucherFileUrl(card.voucherFileUrl) ? (
                <VoucherFilePreview cardId={card.id} voucherFileUrl={card.voucherFileUrl} />
              ) : /^https?:\/\//.test(card.voucherFileUrl) ? (
                <a
                  href={card.voucherFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all text-sm font-medium hover:underline"
                >
                  {card.voucherFileUrl}
                </a>
              ) : (
                <p className="mt-2 break-words text-sm text-zinc-600 dark:text-zinc-300">
                  {card.voucherFileUrl}
                </p>
              )}
            </div>
          )}

          {formOpen && (
            <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              {archivedError ? (
                <p className="text-sm text-status-urgent">{tVisitForm("errors.cardArchived")}</p>
              ) : (
                <VisitForm
                  mode={editingVisit ? "edit" : "add"}
                  initialValues={
                    editingVisit ? visitToFormValues(editingVisit) : emptyVisitFormValues()
                  }
                  submitting={submitting}
                  serverErrors={serverErrors}
                  onSubmit={handleFormSubmit}
                  onCancel={closeForm}
                />
              )}
            </div>
          )}

          <div>
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-base font-semibold">{t("visitsTitle")}</h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                {card.visits.length}
              </span>
            </div>
            {card.visits.length === 0 ? (
              <EmptyState icon={History} className="mt-2">
                {t("emptyState")}
              </EmptyState>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {card.visits.map((visit) => {
                  const { day, month } = formatDayMonthShort(visit.visitDate);
                  return (
                    <li
                      key={visit.id}
                      className={`flex flex-wrap items-center justify-between gap-3 p-3.5 ${CARD_SURFACE_CLASS}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-black/5 px-2.5 py-1.5 dark:bg-white/10">
                          <span className="text-base font-bold leading-none">{day}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground/50">
                            {month}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">
                            {formatWeekday(visit.visitDate)}
                            {visit.visitTime && `, ${formatTime(visit.visitTime)}`}
                          </p>
                          {visit.note && (
                            <p className="break-words text-sm text-zinc-500 dark:text-zinc-400">
                              {visit.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button type="button" variant="ghost" onClick={() => openEditForm(visit)}>
                          {t("editButton")}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => {
                            setDeleteError(false);
                            setDeleteTarget(visit);
                          }}
                        >
                          {t("deleteButton")}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
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

      <ConfirmDialog
        open={deleteCardOpen}
        title={tDeleteCardDialog("title")}
        body={deleteCardError ? tDeleteCardDialog("deleteFailed") : tDeleteCardDialog("body")}
        confirmLabel={tDeleteCardDialog("confirmButton")}
        cancelLabel={tDeleteCardDialog("cancelButton")}
        confirmDisabled={deletingCard}
        onConfirm={handleConfirmDeleteCard}
        onCancel={() => setDeleteCardOpen(false)}
      />
    </div>
  );
}
