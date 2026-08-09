import type { InputHTMLAttributes } from "react";

// Wspólny styl pól tekstowych/liczbowych/dat — wcześniej kopiowany osobno w
// CardForm, VisitForm i PlacesAutocomplete. Dokłada widoczny focus-visible
// ring, którego dotąd brakowało (WCAG — wyraźny stan skupienia klawiatury).
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 ${className}`}
      {...props}
    />
  );
}
