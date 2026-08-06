import { expect, test } from "./support/fixtures";
import { addCardViaWizard, openCardsPage } from "./support/cards";

// docs/TESTING.md, punkty 3-4: zalogowanie wejścia + aktualizacja licznika, edycja i
// usunięcie wejścia z historii.

async function openFirstCard(page: import("@playwright/test").Page, companyName: string) {
  await page.getByRole("link", { name: new RegExp(companyName) }).click();
}

test("zalogowanie wejścia aktualizuje licznik wykorzystanych wejść", async ({
  page,
  company,
}) => {
  await openCardsPage(page);
  await addCardViaWizard(page, { companyName: company.name, totalVisits: 5 });
  await openFirstCard(page, company.name);

  await expect(page.getByText("0/5 wejść")).toBeVisible();

  await page.getByRole("button", { name: "Dodaj wejście" }).click();
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();

  await expect(page.getByText("1/5 wejść")).toBeVisible();
  await expect(page.getByText("0/5 wejść")).toHaveCount(0);
});

test("edycja i usunięcie wejścia z historii", async ({ page, company }) => {
  await openCardsPage(page);
  await addCardViaWizard(page, { companyName: company.name, totalVisits: 5 });
  await openFirstCard(page, company.name);

  await page.getByRole("button", { name: "Dodaj wejście" }).click();
  await page.locator("form").getByLabel("Notatka").fill("Pierwsza wizyta");
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();

  await expect(page.getByText("Pierwsza wizyta")).toBeVisible();

  // Edycja notatki wejścia.
  await page.getByRole("button", { name: "Edytuj" }).click();
  await page.locator("form").getByLabel("Notatka").fill("Zaktualizowana notatka");
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();

  await expect(page.getByText("Zaktualizowana notatka")).toBeVisible();
  await expect(page.getByText("Pierwsza wizyta")).toHaveCount(0);

  // Anulowanie usunięcia wejścia nie kasuje danych.
  await page.getByRole("button", { name: "Usuń" }).click();
  await expect(page.getByRole("heading", { name: "Usunąć to wejście?" })).toBeVisible();
  await page.getByRole("button", { name: "Anuluj" }).click();
  await expect(page.getByText("Zaktualizowana notatka")).toBeVisible();
  await expect(page.getByText("1/5 wejść")).toBeVisible();

  // Potwierdzone usunięcie faktycznie kasuje wejście i zmniejsza licznik.
  await page.getByRole("button", { name: "Usuń" }).click();
  await page.getByRole("button", { name: "Usuń wejście" }).click();

  await expect(page.getByText("Zaktualizowana notatka")).toHaveCount(0);
  await expect(page.getByText("0/5 wejść")).toBeVisible();
});
