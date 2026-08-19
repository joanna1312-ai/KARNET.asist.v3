"use client";

import { Building2, LocateFixed, Plus, Search, Star } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AddCompanyForm, type CreatedCompany } from "@/components/AddCompanyForm";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CompaniesOverviewMap } from "@/components/CompaniesOverviewMap";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { deviceFetch } from "@/lib/device-client";
import { categoryDisplayName } from "@/lib/category-display";
import { extractCity } from "@/lib/address";
import { haversineDistanceKm, type LatLng } from "@/lib/distance";
import type { CategoryColor } from "@/server/system-categories";

type SortBy = "name" | "category" | "nearest";
type GeoStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

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
  address: string | null;
  lat: number | null;
  lng: number | null;
  category: ApiCategory;
  isFavorite: boolean;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<ApiCompany[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    deviceFetch("/api/categories")
      .then(async (response) => {
        if (!response.ok || ignore) return;
        const body: { categories: ApiCategory[] } = await response.json();
        if (!ignore) setCategories(body.categories);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

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

  // Sortowanie "najbliżej mnie" (Sesja V4.1) — świadomy wybór użytkownika, nie
  // automatyczne pytanie o lokalizację przy wejściu na stronę. Zawsze ulepszenie: brak
  // zgody/wsparcia przeglądarki nie psuje reszty strony (filtr, pozostałe sortowania).
  function requestNearestSort() {
    setSortBy("nearest");
    if (geoStatus !== "idle") return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }

    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

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

  function openAddForm() {
    setAddFormOpen(true);
  }

  function closeAddForm() {
    setAddFormOpen(false);
  }

  function handleCategoryCreated(category: ApiCategory) {
    setCategories((prev) => [...prev, category]);
  }

  function handleCompanyCreated(company: CreatedCompany) {
    setCompanies((current) => {
      const withNew = [...(current ?? []), { ...company, isFavorite: false }];
      return withNew.sort((a, b) => a.name.localeCompare(b.name));
    });
    setAddFormOpen(false);
  }

  const t = useTranslations("companiesPage");
  const tCategory = useTranslations("companyCategory");
  const locale = useLocale();
  const distanceFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale]
  );

  function distanceToCompanyKm(company: ApiCompany): number | null {
    if (!userLocation || company.lat == null || company.lng == null) return null;
    return haversineDistanceKm(userLocation, { lat: company.lat, lng: company.lng });
  }

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

  const cityOptions = useMemo(() => {
    if (!companies) return [];
    const cities = new Set<string>();
    for (const company of companies) {
      const city = extractCity(company.address);
      if (city) cities.add(city);
    }
    return [...cities].sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const visibleCompanies = useMemo(() => {
    if (!companies) return [];
    const normalizedFilter = filterText.trim().toLowerCase();

    const filtered = companies.filter((company) => {
      const matchesText =
        normalizedFilter === "" || company.name.toLowerCase().includes(normalizedFilter);
      const matchesCategory =
        filterCategoryId === "all" || company.category.id === filterCategoryId;
      const matchesCity =
        filterCity === "all" || extractCity(company.address) === filterCity;
      return matchesText && matchesCategory && matchesCity;
    });

    const distanceKm = (company: ApiCompany): number | null =>
      userLocation && company.lat != null && company.lng != null
        ? haversineDistanceKm(userLocation, { lat: company.lat, lng: company.lng })
        : null;

    return [...filtered].sort((a, b) => {
      if (sortBy === "nearest" && userLocation) {
        const distanceA = distanceKm(a);
        const distanceB = distanceKm(b);
        // Firmy bez lat/lng (dodane ręcznie przed Sesją V4.1) zawsze na końcu, bez
        // dystansu — nie da się ich uszeregować względem pozycji użytkownika.
        if (distanceA == null && distanceB == null) return a.name.localeCompare(b.name);
        if (distanceA == null) return 1;
        if (distanceB == null) return -1;
        if (distanceA !== distanceB) return distanceA - distanceB;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "category") {
        const categoryCompare = categoryDisplayName(a.category, tCategory).localeCompare(
          categoryDisplayName(b.category, tCategory)
        );
        if (categoryCompare !== 0) return categoryCompare;
      }
      return a.name.localeCompare(b.name);
    });
  }, [companies, filterText, filterCategoryId, filterCity, sortBy, tCategory, userLocation]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        {!addFormOpen && (
          <Button type="button" onClick={openAddForm} className="shrink-0">
            <Plus className="size-4" aria-hidden />
            {t("addCompanyButton")}
          </Button>
        )}
      </div>

      {addFormOpen && (
        <AddCompanyForm
          categories={categories}
          submitting={addSubmitting}
          onSubmittingChange={setAddSubmitting}
          onCategoryCreated={handleCategoryCreated}
          onCreated={handleCompanyCreated}
          onCancel={closeAddForm}
        />
      )}

      {loadError && <p className="text-sm text-status-urgent">{t("loadError")}</p>}

      {companies === null && !loadError && (
        <div className="flex flex-col gap-3" aria-hidden>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-[72px] animate-pulse rounded-[20px] bg-black/5 dark:bg-white/5"
            />
          ))}
        </div>
      )}

      {companies !== null && companies.length === 0 && (
        <EmptyState icon={Building2}>{t("emptyState")}</EmptyState>
      )}

      {companies !== null && companies.length > 0 && (
        <CompaniesOverviewMap
          pins={companies
            .filter((company): company is ApiCompany & { lat: number; lng: number } =>
              company.lat != null && company.lng != null
            )
            .map((company) => ({ id: company.id, name: company.name, lat: company.lat, lng: company.lng }))}
        />
      )}

      {companies !== null && companies.length > 0 && (
        <>
          {/* Mobile: szukajka + pigułka "Najbliżej mnie" zamiast trzech selectów (Etap 5, wariant 1j). */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/40" aria-hidden />
              <input
                type="text"
                value={filterText}
                onChange={(event) => setFilterText(event.target.value)}
                placeholder={t("filterNamePlaceholder")}
                aria-label={t("filterNameLabel")}
                className="min-h-11 w-full rounded-full border border-black/10 bg-transparent py-2 pr-3 pl-10 text-sm dark:border-white/10"
              />
            </div>
            <button
              type="button"
              onClick={requestNearestSort}
              aria-pressed={sortBy === "nearest"}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ${
                sortBy === "nearest"
                  ? "bg-foreground text-background"
                  : "bg-black/5 text-foreground/70 dark:bg-white/10"
              }`}
            >
              <LocateFixed className="size-4" aria-hidden />
              {t("nearestPillLabel")}
            </button>
          </div>

          {/* Desktop: bez zmian względem stanu sprzed Etapu 5. */}
          <div className="hidden flex-col gap-3 sm:flex-row sm:items-center md:flex">
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
            {cityOptions.length > 0 && (
              <select
                value={filterCity}
                onChange={(event) => setFilterCity(event.target.value)}
                aria-label={t("filterCityLabel")}
                className="min-h-11 rounded-xl border border-black/10 bg-transparent px-3 text-sm dark:border-white/10"
              >
                <option value="all">{t("filterCityAll")}</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            )}
            <select
              value={sortBy}
              onChange={(event) => {
                const nextSortBy = event.target.value as SortBy;
                if (nextSortBy === "nearest") {
                  requestNearestSort();
                } else {
                  setSortBy(nextSortBy);
                }
              }}
              aria-label={t("sortByLabel")}
              className="min-h-11 rounded-xl border border-black/10 bg-transparent px-3 text-sm dark:border-white/10"
            >
              <option value="name">{t("sortByName")}</option>
              <option value="category">{t("sortByCategory")}</option>
              <option value="nearest">{t("sortByNearest")}</option>
            </select>
          </div>
        </>
      )}

      {sortBy === "nearest" && (geoStatus === "denied" || geoStatus === "unsupported") && (
        <p className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-sm text-foreground/70 dark:border-white/10 dark:bg-white/5">
          {geoStatus === "denied" ? t("geoDenied") : t("geoUnavailable")}
        </p>
      )}

      {companies !== null && companies.length > 0 && visibleCompanies.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("noFilterResults")}</p>
      )}

      {visibleCompanies.length > 0 && (
        <ul className="flex flex-col gap-3">
          {visibleCompanies.map((company) => (
            <li
              key={company.id}
              className="flex items-center gap-3 rounded-[20px] border border-black/[.07] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.04)] hover:bg-black/5 dark:border-white/[.08] dark:bg-zinc-900 dark:hover:bg-white/5"
            >
              <Link
                href={`/companies/${company.id}`}
                className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1"
              >
                <p className="min-w-0 truncate font-medium">{company.name}</p>
                <p className="flex shrink-0 items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <CategoryIcon slug={company.category.slug} color={company.category.color} />
                  {categoryDisplayName(company.category, tCategory)}
                  {sortBy === "nearest" &&
                    distanceToCompanyKm(company) != null &&
                    ` · ${t("distanceKm", { km: distanceFormatter.format(distanceToCompanyKm(company)!) })}`}
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
                    ? "flex size-11 shrink-0 items-center justify-center text-favorite"
                    : "flex size-11 shrink-0 items-center justify-center text-zinc-400 hover:text-favorite dark:text-zinc-500"
                }
              >
                <Star
                  className="h-5 w-5"
                  fill={company.isFavorite ? "currentColor" : "none"}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
