import { expect, test } from "./support/fixtures";
import { addCardViaWizard, openArchiveTab, openCardsPage } from "./support/cards";

// docs/TESTING.md, punkt 7: karnet automatycznie znika z listy głównej i pojawia się w
// archiwum po osiągnięciu limitu wejść / dacie ważności (Sesja 9 — reguła w
// @/server/card-status.ts, tab "Archiwum" na /cards).
test("karnet trafia do archiwum po wyczerpaniu limitu wejść", async ({ page, company }) => {
  await openCardsPage(page);
  await addCardViaWizard(page, { companyName: company.name, totalVisits: 1 });

  await page.getByRole("link", { name: new RegExp(company.name) }).click();
  await page.getByRole("button", { name: "Dodaj wejście" }).click();
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();
  await expect(page.getByText("1/1 wejść")).toBeVisible();

  await openCardsPage(page);
  await expect(page.getByRole("link", { name: new RegExp(company.name) })).toHaveCount(0);

  await openArchiveTab(page);
  const archivedRow = page.getByRole("link", { name: new RegExp(company.name) });
  await expect(archivedRow).toBeVisible();
  await expect(archivedRow.getByText("1/1 wejść")).toBeVisible();
  await expect(page.getByRole("button", { name: "Odnów" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edytuj" })).toHaveCount(0);
});

test("karnet trafia do archiwum po minięciu daty ważności", async ({ page, company }) => {
  await openCardsPage(page);
  await addCardViaWizard(page, {
    companyName: company.name,
    type: "unlimited",
    expiryDate: "2020-01-01",
  });

  await expect(page.getByRole("link", { name: new RegExp(company.name) })).toHaveCount(0);

  await openArchiveTab(page);
  await expect(page.getByRole("link", { name: new RegExp(company.name) })).toBeVisible();
});

// Sesja V6.3: usedVisits (surowy licznik pokazywany w "X/Y") osiąga limit natychmiast po
// zapisaniu wejścia, niezależnie od daty — ale karnet ma zostać aktywny, dopóki to wejście
// jest dopiero zaplanowane na przyszłość, nie zrealizowane.
test("karnet NIE trafia do archiwum, gdy limit wejść jest osiągnięty tylko wejściem z przyszłą datą", async ({
  page,
  company,
}) => {
  await openCardsPage(page);
  await addCardViaWizard(page, { companyName: company.name, totalVisits: 1 });

  await page.getByRole("link", { name: new RegExp(company.name) }).click();
  await page.getByRole("button", { name: "Dodaj wejście" }).click();
  await page.getByLabel("Data", { exact: true }).fill("2099-01-01");
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();
  await expect(page.getByText("1/1 wejść")).toBeVisible();

  await openCardsPage(page);
  await expect(page.getByRole("link", { name: new RegExp(company.name) })).toBeVisible();

  await openArchiveTab(page);
  await expect(page.getByRole("link", { name: new RegExp(company.name) })).toHaveCount(0);
});
