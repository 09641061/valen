import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("CRM conversations and WhatsApp integration", () => {
  test("renders /conversations inbox controls with zero WCAG violations", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/conversations", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { level: 1, name: "Conversations" }),
    ).toBeVisible();
    await expect(
      page.getByRole("searchbox", { name: "Search customer or message" }),
    ).toBeVisible();

    const filterGroup = page.getByRole("group", {
      name: "Filter conversations by status",
    });
    await expect(
      filterGroup.getByRole("button", { name: "All" }),
    ).toBeVisible();
    await expect(
      filterGroup.getByRole("button", { name: "Open" }),
    ).toBeVisible();
    await expect(
      filterGroup.getByRole("button", { name: "Closed" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("renders /organization WhatsApp Business card and dialog with zero WCAG violations", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/organization", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Channels and integrations")).toBeVisible();
    await expect(page.getByText("WhatsApp Business")).toBeVisible();

    const configureButton = page.getByRole("button", { name: "Configure" });
    await expect(configureButton).toBeVisible();
    await configureButton.click();

    const dialog = page.getByRole("dialog", {
      name: "WhatsApp Business configuration",
    });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
