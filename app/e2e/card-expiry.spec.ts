import { formatDate } from "@/lib/format";
import { expect, test } from "./support/fixtures";
import { addCardViaWizard, openCardsPage } from "./support/cards";

// docs/TESTING.md, punkt 5: edycja daty ważności, w tym wyczyszczenie jej dla karnetu
// typu `limit` (dla `limit` data ważności jest opcjonalna — patrz card-rules.ts).
// Edycja karnetu dzieje się na liście `/cards` (przycisk "Edytuj" przy pozycji), nie na
// stronie szczegółów — tam edytowalne są tylko wejścia (cards/[id]/page.tsx).
test("edycja i wyczyszczenie daty ważności karnetu z limitem", async ({ page, company }) => {
  await openCardsPage(page);
  await addCardViaWizard(page, {
    companyName: company.name,
    totalVisits: 3,
    expiryDate: "2027-01-15",
  });

  const cardRow = page.getByRole("link", { name: new RegExp(company.name) });
  await expect(cardRow.getByText(`ważny do ${formatDate("2027-01-15")}`)).toBeVisible();

  await page.getByRole("button", { name: "Edytuj" }).click();
  await page.locator("form").getByLabel("Data ważności").fill("2027-06-20");
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();

  await expect(cardRow.getByText(`ważny do ${formatDate("2027-06-20")}`)).toBeVisible();

  await page.getByRole("button", { name: "Edytuj" }).click();
  await page.locator("form").getByLabel("Data ważności").fill("");
  await page.locator("form").getByRole("button", { name: "Zapisz" }).click();

  await expect(cardRow.getByText("bez terminu ważności")).toBeVisible();
});
