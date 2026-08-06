import { expect, test } from "./support/fixtures";
import { openCardsPage } from "./support/cards";

// docs/TESTING.md, punkt 8: przełączenie języka PL/EN i trybu ciemnego — brak błędów,
// teksty/motyw się zmieniają.
test("przełączenie języka PL/EN zmienia teksty interfejsu", async ({ page }) => {
  await openCardsPage(page);
  await expect(page.getByRole("heading", { name: "Twoje karnety" })).toBeVisible();

  // Kod w treści przycisku jest zawsze małymi literami ("en"/"pl", patrz
  // LocaleToggle.tsx) niezależnie od aktywnego języka; `exact: true`, bo bez tego np.
  // "en" dopasowałby się też substringiem do "Op**en** Next.js Dev Tools".
  await page.getByRole("button", { name: "en", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Your cards" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add card" })).toBeVisible();

  await page.getByRole("button", { name: "pl", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Twoje karnety" })).toBeVisible();
});

test("przełączenie trybu ciemnego zmienia atrybut motywu", async ({ page }) => {
  await openCardsPage(page);

  const html = page.locator("html");
  const initialTheme = await html.getAttribute("data-theme");
  const otherTheme = initialTheme === "dark" ? "light" : "dark";

  await page.getByRole("button", { name: "Przełącz tryb ciemny" }).click();
  await expect(html).toHaveAttribute("data-theme", otherTheme);

  await page.getByRole("button", { name: "Przełącz tryb ciemny" }).click();
  await expect(html).toHaveAttribute("data-theme", initialTheme ?? "light");
});
