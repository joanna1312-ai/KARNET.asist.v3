import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

// Wspólna "powierzchnia" (zaokrąglenie/obramowanie/tło) używana też poza tym
// komponentem — przez ConfirmDialog/HelpDialog (natywny <dialog>, nie <div>,
// więc nie mogą renderować <Card>) i SettingsMenu (dropdown). Padding i cień
// zostają lokalne dla każdego miejsca użycia, bo się różnią (karta na stronie
// vs. wypiętrzony modal/dropdown).
export const CARD_SURFACE_CLASS =
  "rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900";

export function Card({ className = "", ...props }: CardProps) {
  return <div className={`${CARD_SURFACE_CLASS} p-6 shadow-sm ${className}`} {...props} />;
}
