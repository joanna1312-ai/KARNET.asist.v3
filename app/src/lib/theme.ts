export type Theme = "light" | "dark" | "auto";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "auto") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

export function readStoredTheme(): Theme {
  if (typeof localStorage === "undefined") return "auto";
  const stored = localStorage.getItem("theme");
  return stored === "dark" || stored === "light" ? stored : "auto";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", resolveTheme(theme));
  localStorage.setItem("theme", theme);
}
