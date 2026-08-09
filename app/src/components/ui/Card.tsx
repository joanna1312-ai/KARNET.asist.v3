import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

// Zaokrąglenie i cień dopasowane do istniejących dialogów (ConfirmDialog, HelpDialog,
// SettingsMenu) — ta sama konwencja "rounded-2xl + shadow-xl", tu jako współdzielony
// komponent zamiast kopiowanych klas.
export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900 ${className}`}
      {...props}
    />
  );
}
