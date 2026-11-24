import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("dashboard navigation", () => {
  test("keeps the shell while navigating to a title-only destination", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/agenda", { waitUntil: "networkidle" });

    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Agenda" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "Agenda" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Customers" }).click();

    await expect(page).toHaveURL(/\/customers$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Customers" }),
    ).toBeVisible();
  });

  test("opens the mobile sheet and restores focus when it closes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/agenda", { waitUntil: "networkidle" });

    const openButton = page.getByRole("button", { name: "Open navigation" });
    await openButton.click();

    await expect(page.getByRole("link", { name: "Catalog" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: "Catalog" })).toBeHidden();
    await expect(openButton).toBeFocused();
  });

  test("has no WCAG 2.0/2.1 A/AA accessibility violations on the desktop shell", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/agenda", { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
