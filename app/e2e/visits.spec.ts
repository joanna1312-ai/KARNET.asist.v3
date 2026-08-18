import { expect, test } from "./support/fixtures";
import { addCardViaWizard, openCardsPage, visitCounter } from "./support/cards";

// docs/TESTING.md, punkty 3-4: zalogowanie wejścia + aktualizacja licznika, edycja i
// usunięcie wejścia z historii.

async function openFirstCard(page: import("@playwright/test").Page, companyName: string) {
  await page.getByRole("link", { name: new RegExp(companyName) }).click();
  await expect(page.getByRole("heading", { name: companyName })).toBeVisible();
}

test("zalogowanie wejścia aktualizuje licznik wykorzystanych wejść", async ({
  page,
  company,
}) => {
  await openCardsPage(page);
  await addCardViaWizard(page, { companyName: company.name, totalVisits: 5 });
  await openFirstCard(page, company.name);

  await expect(visitCounter(page, 0, 5)).toBeVisible();

  await page.getByRole("button", { name: "Zapisz wejście", exact: true }).click();
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();

  await expect(visitCounter(page, 1, 5)).toBeVisible();
  await expect(visitCounter(page, 0, 5)).toHaveCount(0);
});

test("edycja i usunięcie wejścia z historii", async ({ page, company }) => {
  await openCardsPage(page);
  await addCardViaWizard(page, { companyName: company.name, totalVisits: 5 });
  await openFirstCard(page, company.name);

  await page.getByRole("button", { name: "Zapisz wejście", exact: true }).click();
  await page.locator("form").getByLabel("Notatka").fill("Pierwsza wizyta");
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();

  await expect(page.getByText("Pierwsza wizyta")).toBeVisible();

  // Edycja notatki wejścia (nazwa dopasowywana ściśle, żeby nie złapać przycisku "Edytuj
  // karnet" w nagłówku strony, który też zaczyna się na "Edytuj").
  await page.getByRole("button", { name: "Edytuj", exact: true }).click();
  await page.locator("form").getByLabel("Notatka").fill("Zaktualizowana notatka");
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();

  await expect(page.getByText("Zaktualizowana notatka")).toBeVisible();
  await expect(page.getByText("Pierwsza wizyta")).toHaveCount(0);

  // Anulowanie usunięcia wejścia nie kasuje danych.
  await page.getByRole("button", { name: "Usuń", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Usunąć to wejście?" })).toBeVisible();
  await page.getByRole("button", { name: "Anuluj" }).click();
  await expect(page.getByText("Zaktualizowana notatka")).toBeVisible();
  await expect(visitCounter(page, 1, 5)).toBeVisible();

  // Potwierdzone usunięcie faktycznie kasuje wejście i zmniejsza licznik.
  await page.getByRole("button", { name: "Usuń", exact: true }).click();
  await page.getByRole("button", { name: "Usuń wejście" }).click();

  await expect(page.getByText("Zaktualizowana notatka")).toHaveCount(0);
  await expect(visitCounter(page, 0, 5)).toBeVisible();
});
