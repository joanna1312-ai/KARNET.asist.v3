import { expect, test } from "./support/fixtures";
import { addCardViaWizard, openCardsPage, visitCounter } from "./support/cards";

// docs/TESTING.md, punkt 1: dodanie nowego karnetu przez kreator (firma istniejąca →
// typ → voucher → zapis). Sprawdza też Sesję 11 (pole tekstowe vouchera) przy okazji,
// bo to część tego samego formularza.
test("dodanie karnetu przez kreator z istniejącą firmą", async ({ page, company }) => {
  await openCardsPage(page);

  await addCardViaWizard(page, {
    companyName: company.name,
    totalVisits: 10,
    voucherFileUrl: "RABAT-2026-TEST",
  });

  const cardRow = page.getByRole("link", { name: new RegExp(company.name) });
  await expect(cardRow).toBeVisible();
  await expect(visitCounter(cardRow, 0, 10)).toBeVisible();

  await cardRow.click();
  await expect(page.getByRole("heading", { name: company.name })).toBeVisible();
  await expect(visitCounter(page, 0, 10)).toBeVisible();
  await expect(page.getByText("RABAT-2026-TEST")).toBeVisible();
});
