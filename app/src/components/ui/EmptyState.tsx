import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
};

// Wspólny wygląd pustych list (karnety, firmy, wejścia, brak rekomendacji) —
// ikona + tekst zamiast gołego zdania, ramka przerywana jak w miejscu-placeholder.
export function EmptyState({ icon: Icon, children, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/15 px-6 py-10 text-center dark:border-white/15 ${className}`}
    >
      <Icon className="size-8 text-foreground/30" strokeWidth={1.5} aria-hidden="true" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>
    </div>
  );
}
