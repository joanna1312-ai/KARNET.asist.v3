"use client";

import { Map as MapIcon, Plus, SearchX } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { deviceFetch } from "@/lib/device-client";
import { categoryDisplayName } from "@/lib/category-display";
import type { CategoryColor } from "@/server/system-categories";

type GeoStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";
type RequestStatus = "idle" | "loading" | "done" | "error";

interface ApiCategory {
  id: string;
  slug: string | null;
  name: string;
  color: CategoryColor;
  isSystem: boolean;
}

interface RecommendationItem {
  name: string;
  reason: string;
  mapsUrl?: string;
}

interface RecommendationResult {
  recommendations: RecommendationItem[];
  relatedSuggestions: RecommendationItem[];
}

// Doradca AI (Sesja V4.2a) — geolokalizacja na żądanie użytkownika (ten sam wzorzec co
// sortowanie "najbliżej mnie" na /companies z V4.1), nigdy automatycznie przy wejściu na
// stronę. Wywołanie AI zawsze może zwrócić `null` (brak klucza, błąd zewnętrznego API,
// brak wystarczających danych) — to nie jest błąd strony, tylko pusty wynik.
export default function RecommendationsPage() {
  const t = useTranslations("recommendationsPage");
  const tCategory = useTranslations("companyCategory");
  const tCardsPage = useTranslations("cardsPage");
  const locale = useLocale();

  const [categories, setCategories] = useState<ApiCategory[] | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const [result, setResult] = useState<RecommendationResult | null>(null);

  useEffect(() => {
    let ignore = false;
    deviceFetch("/api/categories")
      .then(async (response) => {
        if (!response.ok) return;
        const body: { categories: ApiCategory[] } = await response.json();
        if (!ignore) setCategories(body.categories);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  function requestRecommendations(categoryId: string = selectedCategoryId) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }

    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoStatus("granted");
        void fetchRecommendations(position.coords.latitude, position.coords.longitude, categoryId);
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  // Pigułka kategorii (Etap 5, wariant 1k) ustawia stan i od razu odpala zapytanie w
  // jednym dotknięciu — categoryId przekazany jawnie, bo setSelectedCategoryId nie
  // zdąży zaktualizować stanu przed odczytem w tym samym handlerze.
  function selectCategory(categoryId: string) {
    setSelectedCategoryId(categoryId);
    requestRecommendations(categoryId);
  }

  async function fetchRecommendations(lat: number, lng: number, categoryId: string) {
    setRequestStatus("loading");
    const selectedCategory =
      categoryId === "all" ? undefined : categories?.find((category) => category.id === categoryId);

    try {
      const response = await deviceFetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          categoryId: selectedCategory?.id,
          categoryName: selectedCategory
            ? categoryDisplayName(selectedCategory, tCategory)
            : undefined,
          locale,
        }),
      });

      if (!response.ok) {
        setRequestStatus("error");
        return;
      }

      const body: { recommendations: RecommendationResult | null } = await response.json();
      setResult(body.recommendations);
      setRequestStatus("done");
    } catch {
      setRequestStatus("error");
    }
  }

  const isLoading = geoStatus === "requesting" || requestStatus === "loading";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <Logo size="md" className="mb-1" />
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("intro")}</p>
      </div>

      {/* Mobile: pigułki kategorii, dotknięcie od razu odpala lokalizację + zapytanie (Etap 5, wariant 1k). */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden" aria-label={t("categoryLabel")}>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => selectCategory("all")}
          className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${
            selectedCategoryId === "all"
              ? "bg-foreground text-background"
              : "bg-black/5 text-foreground/70 dark:bg-white/10"
          }`}
        >
          {isLoading && selectedCategoryId === "all" ? t("loading") : t("categoryAllPill")}
        </button>
        {(categories ?? []).map((category) => (
          <button
            key={category.id}
            type="button"
            disabled={isLoading}
            onClick={() => selectCategory(category.id)}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${
              selectedCategoryId === category.id
                ? "bg-foreground text-background"
                : "bg-black/5 text-foreground/70 dark:bg-white/10"
            }`}
          >
            {isLoading && selectedCategoryId === category.id
              ? t("loading")
              : categoryDisplayName(category, tCategory)}
          </button>
        ))}
      </div>

      {/* Desktop: bez zmian względem stanu sprzed Etapu 5. */}
      <div className="hidden flex-col gap-3 sm:flex-row sm:items-center md:flex">
        <select
          value={selectedCategoryId}
          onChange={(event) => setSelectedCategoryId(event.target.value)}
          aria-label={t("categoryLabel")}
          className="min-h-11 rounded-xl border border-black/10 bg-transparent px-3 text-sm dark:border-white/10"
        >
          <option value="all">{t("categoryAll")}</option>
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {categoryDisplayName(category, tCategory)}
            </option>
          ))}
        </select>
        <Button type="button" onClick={() => requestRecommendations()} disabled={isLoading}>
          {isLoading ? t("loading") : t("submitButton")}
        </Button>
      </div>

      {(geoStatus === "denied" || geoStatus === "unsupported") && (
        <p className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-sm text-foreground/70 dark:border-white/10 dark:bg-white/5">
          {geoStatus === "denied" ? t("geoDenied") : t("geoUnavailable")}
        </p>
      )}

      {requestStatus === "error" && (
        <p className="text-sm text-status-urgent">{t("loadError")}</p>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3" aria-hidden>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-[100px] animate-pulse rounded-[20px] bg-black/5 dark:bg-white/5"
            />
          ))}
        </div>
      )}

      {requestStatus === "done" && result === null && (
        <EmptyState icon={SearchX}>{t("noResults")}</EmptyState>
      )}

      {requestStatus === "done" && result !== null && (
        <div className="flex flex-col gap-6">
          {result.recommendations.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{t("nearbyHeading")}</h2>
              <ul className="flex flex-col gap-3">
                {result.recommendations.map((item, index) => (
                  <li
                    key={`${item.name}-${index}`}
                    className="rounded-[20px] border border-black/[.07] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.04)] dark:border-white/[.08] dark:bg-zinc-900"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.mapsUrl && (
                        <a
                          href={item.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-9 items-center gap-1.5 rounded-full bg-black/5 px-3.5 text-sm font-semibold text-foreground/70 dark:bg-white/10"
                        >
                          <MapIcon className="size-4" aria-hidden />
                          {t("mapButton")}
                        </a>
                      )}
                      <Link
                        href="/cards/new"
                        className="flex min-h-9 items-center gap-1.5 rounded-full bg-mint px-3.5 text-sm font-semibold text-mint-ink"
                      >
                        <Plus className="size-4" aria-hidden />
                        {tCardsPage("addButton")}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.relatedSuggestions.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{t("relatedHeading")}</h2>
              <ul className="flex flex-col gap-3">
                {result.relatedSuggestions.map((item, index) => (
                  <li
                    key={`${item.name}-${index}`}
                    className="rounded-[20px] border border-black/[.07] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.04)] dark:border-white/[.08] dark:bg-zinc-900"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
