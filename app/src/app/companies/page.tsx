"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { deviceFetch } from "@/lib/device-client";
import { CATEGORY_COLOR_CLASS, categoryDisplayName } from "@/lib/category-display";
import type { CategoryColor } from "@/server/system-categories";

type SortBy = "name" | "category";

interface ApiCategory {
  id: string;
  slug: string | null;
  name: string;
  color: CategoryColor;
  isSystem: boolean;
}

interface ApiCompany {
  id: string;
  name: string;
  category: ApiCategory;
  isFavorite: boolean;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 3l2.7 5.9 6.3.6-4.8 4.2 1.4 6.2L12 16.9 6.4 20l1.4-6.2L3 9.5l6.3-.6L12 3z" />
    </svg>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<ApiCompany[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");

  useEffect(() => {
    let ignore = false;

    deviceFetch("/api/companies")
      .then(async (response) => {
        if (!response.ok) throw new Error("load_failed");
        const body: { companies: ApiCompany[] } = await response.json();
        if (!ignore) {
          setCompanies(body.companies);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoadError(true);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function toggleFavorite(company: ApiCompany) {
    const nextIsFavorite = !company.isFavorite;
    setCompanies(
      (current) =>
        current?.map((item) =>
          item.id === company.id ? { ...item, isFavorite: nextIsFavorite } : item
        ) ?? current
    );

    const response = await deviceFetch(`/api/companies/favorites/${company.id}`, {
      method: nextIsFavorite ? "POST" : "DELETE",
    });

    if (!response.ok) {
      setCompanies(
        (current) =>
          current?.map((item) =>
            item.id === company.id ? { ...item, isFavorite: company.isFavorite } : item
          ) ?? current
      );
    }
  }

  const t = useTranslations("companiesPage");
  const tCategory = useTranslations("companyCategory");

  const categoryOptions = useMemo(() => {
    if (!companies) return [];
    const byId = new Map<string, { id: string; label: string }>();
    for (const company of companies) {
      if (!byId.has(company.category.id)) {
        byId.set(company.category.id, {
          id: company.category.id,
          label: categoryDisplayName(company.category, tCategory),
        });
      }
    }
    return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [companies, tCategory]);

  const visibleCompanies = useMemo(() => {
    if (!companies) return [];
    const normalizedFilter = filterText.trim().toLowerCase();

    const filtered = companies.filter((company) => {
      const matchesText =
        normalizedFilter === "" || company.name.toLowerCase().includes(normalizedFilter);
      const matchesCategory =
        filterCategoryId === "all" || company.category.id === filterCategoryId;
      return matchesText && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "category") {
        const categoryCompare = categoryDisplayName(a.category, tCategory).localeCompare(
          categoryDisplayName(b.category, tCategory)
        );
        if (categoryCompare !== 0) return categoryCompare;
      }
      return a.name.localeCompare(b.name);
    });
  }, [companies, filterText, filterCategoryId, sortBy, tCategory]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {loadError && <p className="text-sm text-status-urgent">{t("loadError")}</p>}

      {companies === null && !loadError && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">…</p>
      )}

      {companies !== null && companies.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("emptyState")}</p>
      )}

      {companies !== null && companies.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            placeholder={t("filterNamePlaceholder")}
            aria-label={t("filterNameLabel")}
            className="min-h-11 flex-1 rounded-xl border border-black/10 bg-transparent px-3 text-sm dark:border-white/10"
          />
          <select
            value={filterCategoryId}
            onChange={(event) => setFilterCategoryId(event.target.value)}
            aria-label={t("filterCategoryLabel")}
            className="min-h-11 rounded-xl border border-black/10 bg-transparent px-3 text-sm dark:border-white/10"
          >
            <option value="all">{t("filterCategoryAll")}</option>
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            aria-label={t("sortByLabel")}
            className="min-h-11 rounded-xl border border-black/10 bg-transparent px-3 text-sm dark:border-white/10"
          >
            <option value="name">{t("sortByName")}</option>
            <option value="category">{t("sortByCategory")}</option>
          </select>
        </div>
      )}

      {companies !== null && companies.length > 0 && visibleCompanies.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("noFilterResults")}</p>
      )}

      {visibleCompanies.length > 0 && (
        <ul className="flex flex-col gap-3">
          {visibleCompanies.map((company) => (
            <li
              key={company.id}
              className="flex items-center gap-3 rounded-2xl border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              <Link
                href={`/companies/${company.id}`}
                className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1"
              >
                <p className="min-w-0 truncate font-medium">{company.name}</p>
                <p className="flex shrink-0 items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${CATEGORY_COLOR_CLASS[company.category.color]}`}
                  />
                  {categoryDisplayName(company.category, tCategory)}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => toggleFavorite(company)}
                aria-pressed={company.isFavorite}
                aria-label={
                  company.isFavorite ? t("removeFavorite") : t("addFavorite")
                }
                className={
                  company.isFavorite
                    ? "flex size-11 shrink-0 items-center justify-center text-accent-deep"
                    : "flex size-11 shrink-0 items-center justify-center text-zinc-400 hover:text-accent-deep dark:text-zinc-500"
                }
              >
                <StarIcon filled={company.isFavorite} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
