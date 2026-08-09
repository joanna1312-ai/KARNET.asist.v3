import type { ButtonHTMLAttributes } from "react";

// Warianty odzwierciedlają system, który już istniał (rozproszony po plikach) —
// nie wprowadzają nowej kolorystyki:
const VARIANT_STYLES = {
  // Główna akcja (Zapisz, Dodaj karnet/wejście) — mięta, tak jak w referencji marki.
  primary: "bg-mint text-mint-ink hover:brightness-95",
  // Neutralny wypełniony przycisk (np. logowanie) — mniej wyróżniony niż primary.
  neutral: "bg-black/5 text-foreground hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15",
  // Drugorzędna akcja (Anuluj, Edytuj, Odnów) — przezroczysty, tylko hover.
  ghost: "bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/10",
  // Destrukcyjna akcja w wierszu listy (Usuń) — jak ghost, ale czerwony tekst.
  danger: "bg-transparent text-status-urgent hover:bg-black/5 dark:hover:bg-white/10",
  // Potwierdzenie usunięcia w dialogu (wysoki priorytet, wypełniony) — koral.
  "danger-solid": "bg-coral text-coral-ink hover:brightness-95",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANT_STYLES;
};

export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}
