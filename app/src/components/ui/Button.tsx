import type { ButtonHTMLAttributes } from "react";

const VARIANT_STYLES = {
  // Wypełniony przycisk akcji głównej — odpowiednik "filled button" z Material 3 /
  // przycisku akcji w iOS HIG. Pigułkowy kształt jak w referencji marki.
  primary: "bg-accent text-white hover:bg-accent-deep",
  // "Tonal button" — subtelne tło z tokenu marki, dla akcji drugoplanowych.
  secondary: "bg-mint/30 text-mint-ink hover:bg-mint/45 dark:bg-mint/20 dark:hover:bg-mint/30",
  // "Text/outlined button" — najniższy priorytet wizualny.
  ghost: "bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/10",
  danger: "bg-status-urgent text-white hover:opacity-90",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANT_STYLES;
};

export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}
