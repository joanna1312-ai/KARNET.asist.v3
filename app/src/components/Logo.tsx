const SIZE_STYLES = {
  sm: { dot: "size-2", text: "text-sm" },
  md: { dot: "size-2.5", text: "text-base" },
  lg: { dot: "size-3.5", text: "text-2xl" },
} as const;

type LogoProps = {
  size?: keyof typeof SIZE_STYLES;
  className?: string;
};

// Wordmark marki. Wersaliki "KARNET" łagodzi zaokrąglony krój Baloo 2 (font-brand)
// — stąd nie ma tu efektu twardego, korporacyjnego caps-locka mimo dużych liter.
export function Logo({ size = "md", className = "" }: LogoProps) {
  const { dot, text } = SIZE_STYLES[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden className={`${dot} shrink-0 rounded-full bg-accent`} />
      <span className={`truncate font-brand font-extrabold tracking-tight ${text}`}>
        KARNET<span className="font-semibold">.asist</span>
      </span>
    </span>
  );
}
