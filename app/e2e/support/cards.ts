import type { Page } from "@playwright/test";

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

// Pełen przepływ kreatora (Sesja 13, punkt 1 z docs/TESTING.md) — używany też jako
// setup w testach, które potrzebują istniejącego karnetu (wejścia, archiwizacja itd.).
export async function addCardViaWizard(page: Page, options: NewCardOptions): Promise<void> {
  await page.getByRole("button", { name: "Dodaj karnet" }).click();
  await fillCardForm(page, options);
  await submitCardForm(page);
}
