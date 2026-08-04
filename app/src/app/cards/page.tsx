"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CardForm,
  CardFormValues,
  CompanyOption,
  emptyCardFormValues,
} from "@/components/CardForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CardType, VoucherMode } from "@/generated/prisma/enums";
import { deviceFetch } from "@/lib/device-client";
import { formatDate } from "@/lib/format";
import { dictionary } from "@/lib/i18n/dictionary";
import { CardInputErrorCode } from "@/server/card-rules";

interface ApiCard {
  id: string;
  type: CardType;
  totalVisits: number | null;
  usedVisits: number;
  expiryDate: string | null;
  voucherMode: VoucherMode;
  company: { id: string; name: string; category: string };
}

function cardToFormValues(card: ApiCard): CardFormValues {
  return {
    companyId: card.company.id,
    type: card.type,
    totalVisits: card.totalVisits != null ? String(card.totalVisits) : "",
    expiryDate: card.expiryDate ? card.expiryDate.slice(0, 10) : "",
    voucherMode: card.voucherMode,
  };
}

async function fetchCardsAndCompanies(): Promise<{
  companies: CompanyOption[];
  cards: ApiCard[];
}> {
  const [companiesRes, cardsRes] = await Promise.all([
    deviceFetch("/api/companies"),
    deviceFetch("/api/cards"),
  ]);
  if (!companiesRes.ok || !cardsRes.ok) throw new Error("load_failed");
  const companiesBody: { companies: CompanyOption[] } = await companiesRes.json();
  const cardsBody: { cards: ApiCard[] } = await cardsRes.json();
  return { companies: companiesBody.companies, cards: cardsBody.cards };
}

export default function CardsPage() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [cards, setCards] = useState<ApiCard[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ApiCard | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<CardInputErrorCode[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<ApiCard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await fetchCardsAndCompanies();
      setCompanies(data.companies);
      setCards(data.cards);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchCardsAndCompanies()
      .then((data) => {
        if (ignore) return;
        setCompanies(data.companies);
        setCards(data.cards);
        setLoadError(false);
      })
      .catch(() => {
        if (!ignore) setLoadError(true);
      });

    return () => {
      ignore = true;
    };
  }, []);

  function openAddForm() {
    setEditingCard(null);
    setServerErrors([]);
    setFormOpen(true);
  }

  function openEditForm(card: ApiCard) {
    setEditingCard(card);
    setServerErrors([]);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCard(null);
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

  const t = dictionary.cardsPage;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <button
          type="button"
          onClick={openAddForm}
          className="rounded-full bg-mint px-4 py-2 text-sm font-semibold text-mint-ink hover:brightness-95"
        >
          {t.addButton}
        </button>
      </div>

      {formOpen && (
        <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <CardForm
            mode={editingCard ? "edit" : "add"}
            companies={companies}
            initialValues={editingCard ? cardToFormValues(editingCard) : emptyCardFormValues}
            submitting={submitting}
            serverErrors={serverErrors}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        </div>
      )}

      {loadError && <p className="text-sm text-status-urgent">{t.loadError}</p>}

      {cards === null && !loadError && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">…</p>
      )}

      {cards !== null && cards.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.emptyState}</p>
      )}

      {cards !== null && cards.length > 0 && (
        <ul className="flex flex-col gap-3">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex items-center justify-between rounded-2xl border border-black/10 p-4 dark:border-white/10"
            >
              <Link href={`/cards/${card.id}`} className="hover:underline">
                <p className="font-medium">{card.company.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {card.type === CardType.limit
                    ? `${card.usedVisits}/${card.totalVisits} wejść`
                    : "Bez limitu wejść"}
                  {" · "}
                  {card.expiryDate
                    ? `ważny do ${formatDate(card.expiryDate)}`
                    : "bez terminu ważności"}
                </p>
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditForm(card)}
                  className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {t.editButton}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(false);
                    setDeleteTarget(card);
                  }}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-status-urgent hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {t.deleteButton}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={dictionary.deleteCardDialog.title}
        body={
          deleteError
            ? dictionary.deleteCardDialog.deleteFailed
            : dictionary.deleteCardDialog.body
        }
        confirmLabel={dictionary.deleteCardDialog.confirmButton}
        cancelLabel={dictionary.deleteCardDialog.cancelButton}
        confirmDisabled={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
