import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("dashboard navigation", () => {
  test("keeps the shell while navigating to a title-only destination", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/agenda");

    await expect(
      page.getByRole("navigation", { name: "Navegación principal" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Agenda" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("heading", { level: 1, name: "Agenda" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Clientes" }).click();

    await expect(page).toHaveURL(/\/customers$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Clientes" }),
    ).toBeVisible();
  });

  test("opens the mobile sheet and restores focus when it closes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/agenda");

    const openButton = page.getByRole("button", { name: "Abrir navegación" });
    await openButton.click();

    await expect(
      page.getByRole("link", { name: "Catálogo" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("link", { name: "Catálogo" }),
    ).toBeHidden();
    await expect(openButton).toBeFocused();
  });

  test("has no detected accessibility violations on the desktop shell", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/agenda");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
