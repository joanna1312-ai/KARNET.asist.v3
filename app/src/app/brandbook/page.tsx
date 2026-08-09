"use client";

import { CircleHelp, MapPin, Settings, Star, Sun, Ticket } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Logo } from "@/components/Logo";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CATEGORY_COLOR_CLASS } from "@/lib/category-display";
import { DEFAULT_CATEGORY_ICON, SYSTEM_CATEGORY_ICONS } from "@/lib/category-icons";
import { SYSTEM_CATEGORY_SEED } from "@/server/system-categories";

const COLOR_TOKENS = [
  { name: "accent", label: "Accent (marka)", swatch: "bg-accent" },
  { name: "accent-deep", label: "Accent deep (hover)", swatch: "bg-accent-deep" },
  { name: "mint", label: "Mint", swatch: "bg-mint" },
  { name: "mint-ink", label: "Mint ink", swatch: "bg-mint-ink" },
  { name: "coral", label: "Coral", swatch: "bg-coral" },
  { name: "coral-ink", label: "Coral ink", swatch: "bg-coral-ink" },
  { name: "status-ok", label: "Status: ok", swatch: "bg-status-ok" },
  { name: "status-soon", label: "Status: wkrótce", swatch: "bg-status-soon" },
  { name: "status-urgent", label: "Status: pilne", swatch: "bg-status-urgent" },
  { name: "favorite", label: "Ulubione (gwiazdka)", swatch: "bg-favorite" },
  { name: "sky", label: "Kategoria: sky", swatch: "bg-sky" },
  { name: "violet", label: "Kategoria: violet", swatch: "bg-violet" },
  { name: "slate", label: "Kategoria: slate", swatch: "bg-slate" },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-brand text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

// Strona wewnętrzna (nie w nawigacji) — żywy podgląd fundamentu wizualnego V5:
// logotyp, paleta, typografia, przyciski, karty, ikony, statusy. Niedostępna
// na produkcji.
export default function BrandbookPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-accent-deep">KARNET.asist · Brand book V5</p>
        <p className="text-sm text-foreground/70">
          Fundament wizualny: logotyp, paleta, typografia, komponenty bazowe. Podgląd roboczy —
          niepublikowana strona.
        </p>
      </header>

      <Section title="Logotyp">
        <Card className="flex flex-wrap items-center gap-8 p-8">
          <Logo size="sm" />
          <Logo size="md" />
          <Logo size="lg" />
        </Card>
      </Section>

      <Section title="Typografia">
        <Card className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground/50">
              font-brand (Baloo 2) — logotyp, nagłówki
            </p>
            <p className="font-brand text-3xl font-extrabold tracking-tight">
              Twoje karnety zawsze pod ręką
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground/50">
              font-sans (Geist) — treść
            </p>
            <p className="text-base">
              Śledź terminy ważności karnetów, otrzymuj przypomnienia i rekomendacje firm w
              okolicy.
            </p>
          </div>
        </Card>
      </Section>

      <Section title="Paleta kolorów">
        <Card>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COLOR_TOKENS.map((token) => (
              <div key={token.name} className="flex items-center gap-2">
                <span className={`size-8 shrink-0 rounded-full border border-black/10 dark:border-white/10 ${token.swatch}`} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{token.label}</p>
                  <p className="truncate text-xs text-foreground/50">--{token.name}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Przyciski">
        <Card className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Dodaj karnet</Button>
          <Button variant="ghost">Anuluj</Button>
          <Button variant="neutral">Zaloguj przez Google</Button>
          <Button variant="danger">Usuń</Button>
          <Button variant="danger-solid">Usuń na pewno</Button>
          <Button variant="primary" disabled>
            Wyłączony
          </Button>
        </Card>
      </Section>

      <Section title="Pusty stan">
        <EmptyState icon={Ticket}>
          Nie masz jeszcze żadnego karnetu. Dodaj pierwszy, żeby mieć go zawsze pod ręką.
        </EmptyState>
      </Section>

      <Section title="Statusy">
        <Card className="flex flex-wrap items-center gap-2">
          <StatusBadge status="ok" />
          <StatusBadge status="soon" />
          <StatusBadge status="urgent" />
          <StatusBadge status="wygasł" />
          <StatusBadge status="brak terminu" />
        </Card>
      </Section>

      <Section title="Ikony kategorii">
        <Card className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SYSTEM_CATEGORY_SEED.map(({ slug, name, color }) => {
              const Icon = SYSTEM_CATEGORY_ICONS[slug];
              return (
                <div key={slug} className="flex items-center gap-2.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-white ${CATEGORY_COLOR_CLASS[color]}`}
                  >
                    <Icon className="size-4.5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-foreground/50">{slug}</p>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-white ${CATEGORY_COLOR_CLASS.slate}`}
              >
                <DEFAULT_CATEGORY_ICON className="size-4.5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Kategoria własna</p>
                <p className="truncate text-xs text-foreground/50">domyślna ikona</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-foreground/50">
            Kolor kółka = dotychczasowy token kategorii ({"{"}mint, coral, accent, sky, violet,
            slate{"}"}), ikona w środku.
          </p>
          <div className="border-t border-black/10 pt-4 dark:border-white/10">
            <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">
              Rozmiar w UI (lista firm, karnety wg kategorii) — komponent CategoryIcon
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              {SYSTEM_CATEGORY_SEED.map(({ slug, name, color }) => (
                <p key={slug} className="flex items-center gap-1.5">
                  <CategoryIcon slug={slug} color={color} />
                  {name}
                </p>
              ))}
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Ikony (lucide-react)">
        <Card className="flex flex-wrap items-center gap-6 text-foreground">
          {[Sun, Settings, CircleHelp, Star, MapPin].map((Icon, index) => (
            <span key={index} className="flex flex-col items-center gap-1.5 text-xs text-foreground/60">
              <Icon className="size-6" strokeWidth={1.8} />
            </span>
          ))}
        </Card>
      </Section>
    </main>
  );
}
