import type { Locator, Page } from "@playwright/test";

export async function openCardsPage(page: Page): Promise<void> {
  await page.goto("/cards");
}

export async function openArchiveTab(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Archiwum" }).click();
}

export interface NewCardOptions {
  companyName: string;
  type?: "limit" | "unlimited";
  totalVisits?: number;
  expiryDate?: string;
  voucherFileUrl?: string;
}

// Wypełnia formularz kreatora/edycji karnetu w trybie "firma istniejąca" (domyślny).
// Kolejność <select>ów w CardForm.tsx w tym trybie: firma, potem (niżej) sposób
// pokazywania vouchera — stąd nth(0)/nth(1); pole "Firma" nie ma własnego <label htmlFor>
// w komponencie (span, nie label), więc nie da się go trafić przez getByLabel.
export async function fillCardForm(page: Page, options: NewCardOptions): Promise<void> {
  const form = page.locator("form");

  await form.getByRole("combobox").nth(0).selectOption({ label: options.companyName });

  if (options.type === "unlimited") {
    await form.getByRole("radio", { name: "Bez limitu" }).check();
  }

  if (options.totalVisits != null) {
    await form.getByLabel("Liczba wejść").fill(String(options.totalVisits));
  }

  if (options.expiryDate !== undefined) {
    await form.getByLabel("Data ważności").fill(options.expiryDate);
  }

  if (options.voucherFileUrl !== undefined) {
    await form.getByLabel("Treść lub link do vouchera").fill(options.voucherFileUrl);
  }
}

export async function submitCardForm(page: Page): Promise<void> {
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();
}

// Licznik wejść (kropki `VisitDots`, redesign mobilny Faza v5b/Sesja 13) — widoczny tekst
// to samo "X/Y" bez słowa "wejść" (to jest tylko w aria-label, dla czytników ekranu).
// Testy celują w aria-label, bo to jedyny sposób trafić dokładnie w jeden element: goły
// tekst "X/Y" pasowałby równocześnie do zewnętrznego <span> (całość) i wewnętrznego
// (sam licznik), co Playwright zgłosiłby jako niejednoznaczne dopasowanie.
export function visitCounter(scope: Page | Locator, used: number, total: number): Locator {
  return scope.locator(`[aria-label="${used}/${total} wejść"]`);
}

// Wiersz karnetu w zakładce "Archiwum" (`ArchivedCardItem.tsx`) — w odróżnieniu od wiersza
// na liście aktywnych (`CardListItem.tsx`, `<Link>`), archiwalny wiersz to zwykłe `<li>`
// bez nawigacji (karnetu zarchiwizowanego nie da się już otworzyć/edytować) — stąd
// `getByRole("listitem")`, nie `getByRole("link")`.
export function archivedCardRow(page: Page, companyName: string): Locator {
  return page.getByRole("listitem").filter({ hasText: companyName });
}

// Pełen przepływ kreatora (Sesja 13, punkt 1 z docs/TESTING.md) — używany też jako
// setup w testach, które potrzebują istniejącego karnetu (wejścia, archiwizacja itd.).
export async function addCardViaWizard(page: Page, options: NewCardOptions): Promise<void> {
  await page.getByRole("button", { name: "Dodaj karnet" }).click();
  await fillCardForm(page, options);
  await submitCardForm(page);
}
