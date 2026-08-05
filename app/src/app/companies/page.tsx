"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CompanyCategory } from "@/generated/prisma/enums";
import { deviceFetch } from "@/lib/device-client";

interface ApiCompany {
  id: string;
  name: string;
  category: CompanyCategory;
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
            <li key={company.id}>
              <Link
                href={`/companies/${company.id}`}
                className="flex items-center justify-between rounded-2xl border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                <p className="font-medium">{company.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {tCategory(company.category)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
