"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { deviceFetch } from "@/lib/device-client";
import { CATEGORY_COLOR_CLASS, categoryDisplayName } from "@/lib/category-display";
import type { CategoryColor } from "@/server/system-categories";

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
        <ul className="flex flex-col gap-3">
          {companies.map((company) => (
            <li
              key={company.id}
              className="flex items-center gap-3 rounded-2xl border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              <Link
                href={`/companies/${company.id}`}
                className="flex flex-1 items-center justify-between gap-3"
              >
                <p className="font-medium">{company.name}</p>
                <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
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
                    ? "shrink-0 text-accent-deep"
                    : "shrink-0 text-zinc-400 hover:text-accent-deep dark:text-zinc-500"
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
