import type { SelectHTMLAttributes } from "react";

// Odpowiednik Input.tsx dla <select>. Domyślny padding-left można nadpisać
// przez `style={{ paddingLeft: ... }}` (np. gdy przed selectem stoi ikona
// kategorii) — nie przez className, bo konfliktujące klasy Tailwind o tej
// samej specyficzności (px-3 z bazy vs. pl-10 z wywołania) nie mają
// gwarantowanej kolejności bez narzędzia do scalania klas.
export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`min-h-11 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 ${className}`}
      {...props}
    />
  );
}
