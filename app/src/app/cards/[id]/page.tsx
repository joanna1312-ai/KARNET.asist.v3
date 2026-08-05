"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { emptyVisitFormValues, VisitForm, VisitFormValues } from "@/components/VisitForm";
import { CardType } from "@/generated/prisma/enums";
import { deviceFetch } from "@/lib/device-client";
import { formatDate, formatTime } from "@/lib/format";
import { isCardArchived } from "@/server/card-status";
import { VisitInputErrorCode } from "@/server/visit-rules";

interface ApiVisit {
  id: string;
  visitDate: string;
  visitTime: string | null;
  note: string | null;
}

interface ApiCard {
  id: string;
  type: CardType;
  totalVisits: number | null;
  usedVisits: number;
  expiryDate: string | null;
  voucherFileUrl: string | null;
  company: { id: string; name: string; category: string };
  visits: ApiVisit[];
}

function visitToFormValues(visit: ApiVisit): VisitFormValues {
  return {
    visitDate: visit.visitDate.slice(0, 10),
    visitTime: visit.visitTime ? visit.visitTime.slice(11, 16) : "",
    note: visit.note ?? "",
  };
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

export default function CardDetailsPage() {
  const params = useParams<{ id: string }>();
  const cardId = params.id;

  const [card, setCard] = useState<ApiCard | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<ApiVisit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<VisitInputErrorCode[]>([]);
  const [archivedError, setArchivedError] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ApiVisit | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

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

  const t = useTranslations("cardDetailsPage");
  const tVisitForm = useTranslations("visitForm");
  const tDeleteDialog = useTranslations("deleteVisitDialog");

  const archived =
    card != null &&
    isCardArchived({
      type: card.type,
      totalVisits: card.totalVisits,
      usedVisits: card.usedVisits,
      expiryDate: card.expiryDate ? new Date(card.expiryDate) : null,
    });

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/cards" className="text-sm font-medium hover:underline">
        {t("backLink")}
      </Link>

      {loadError && <p className="text-sm text-status-urgent">{t("loadError")}</p>}

      {card && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{card.company.name}</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {card.type === CardType.limit && card.totalVisits != null
                  ? t("limitCounter", { used: card.usedVisits, total: card.totalVisits })
                  : t("unlimitedLabel")}
                {" · "}
                {card.expiryDate
                  ? t("expiryLabel", { date: formatDate(card.expiryDate) })
                  : t("noExpiryLabel")}
              </p>
            </div>
            {!archived && (
              <button
                type="button"
                onClick={openAddForm}
                className="rounded-full bg-mint px-4 py-2 text-sm font-semibold text-mint-ink hover:brightness-95"
              >
                {t("addVisitButton")}
              </button>
            )}
          </div>

          {archived && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("archivedNotice")}</p>
          )}

          {card.voucherFileUrl && (
            <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <h2 className="text-sm font-medium">{t("voucherLabel")}</h2>
              {/^https?:\/\//.test(card.voucherFileUrl) ? (
                <a
                  href={card.voucherFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-sm font-medium hover:underline"
                >
                  {card.voucherFileUrl}
                </a>
              ) : (
                <p className="mt-1 break-words text-sm text-zinc-600 dark:text-zinc-300">
                  {card.voucherFileUrl}
                </p>
              )}
            </div>
          )}

          {formOpen && (
            <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              {archivedError ? (
                <p className="text-sm text-status-urgent">
                  {tVisitForm("errors.cardArchived")}
                </p>
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
            <h2 className="text-lg font-semibold">{t("visitsTitle")}</h2>
            {card.visits.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("emptyState")}</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {card.visits.map((visit) => (
                  <li
                    key={visit.id}
                    className="flex items-center justify-between rounded-2xl border border-black/10 p-4 dark:border-white/10"
                  >
                    <div>
                      <p className="font-medium">
                        {formatDate(visit.visitDate)}
                        {visit.visitTime && ` · ${formatTime(visit.visitTime)}`}
                      </p>
                      {visit.note && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{visit.note}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(visit)}
                        className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {t("editButton")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(false);
                          setDeleteTarget(visit);
                        }}
                        className="rounded-full px-3 py-1.5 text-sm font-medium text-status-urgent hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {t("deleteButton")}
                      </button>
                    </div>
                  </li>
                ))}
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
    </div>
  );
}
