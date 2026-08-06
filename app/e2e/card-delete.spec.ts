import { expect, test } from "./support/fixtures";
import { addCardViaWizard, openCardsPage } from "./support/cards";

// docs/TESTING.md, punkt 6: usunięcie karnetu — dialog potwierdzający się pojawia,
// anulowanie nie usuwa danych (CLAUDE.md: usuwanie zawsze przez dialog, nigdy jednym
// kliknięciem).
test("usunięcie karnetu wymaga potwierdzenia; anulowanie nie usuwa danych", async ({
  page,
  company,
}) => {
  await openCardsPage(page);
  await addCardViaWizard(page, { companyName: company.name, totalVisits: 1 });

  const cardRow = page.getByRole("link", { name: new RegExp(company.name) });
  await expect(cardRow).toBeVisible();

  await page.getByRole("button", { name: "Usuń" }).click();
  await expect(page.getByRole("heading", { name: "Usunąć ten karnet?" })).toBeVisible();

  await page.getByRole("button", { name: "Anuluj" }).click();
  await expect(cardRow).toBeVisible();

  await page.getByRole("button", { name: "Usuń" }).click();
  await page.getByRole("button", { name: "Usuń karnet" }).click();

  await expect(cardRow).toHaveCount(0);
});
