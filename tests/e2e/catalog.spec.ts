import AxeBuilder from "@axe-core/playwright";
import { expect, request as playwrightRequest, test } from "@playwright/test";

const CYNTHIA_API_URL = process.env.CYNTHIA_API_URL ?? "http://127.0.0.1:8081";

test.describe("catalog management against live Cynthia backend", () => {
  const createdCategoryNames: string[] = [];

  test.afterEach(async () => {
    if (createdCategoryNames.length === 0) return;
    const api = await playwrightRequest.newContext();
    try {
      const res = await api.get(`${CYNTHIA_API_URL}/v1/catalog`);
      if (res.ok()) {
        const categories = (await res.json()) as Array<{
          id: string;
          name: string;
          version: number;
        }>;
        for (const cat of categories) {
          if (createdCategoryNames.includes(cat.name)) {
            await api.delete(
              `${CYNTHIA_API_URL}/v1/catalog/categories/${cat.id}`,
              { headers: { "If-Match": `"v${cat.version}"` } },
            );
          }
        }
      }
    } finally {
      createdCategoryNames.length = 0;
      await api.dispose();
    }
  });

  test("full CRUD flow persists across reloads and cleans up created records", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const suffix = Date.now();
    const categoryName = `Catalog E2E ${suffix}`;
    const updatedCategoryName = `Catalog Edited ${suffix}`;
    const serviceName = `Service E2E ${suffix}`;
    const updatedServiceName = `Service Edited ${suffix}`;
    createdCategoryNames.push(categoryName, updatedCategoryName);

    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/catalog", { waitUntil: "networkidle" });

    await expect(
      page.getByRole("heading", { level: 1, name: "Catalog" }),
    ).toBeVisible();

    // Create category
    await page.getByRole("button", { name: "New category" }).click();
    await expect(
      page.getByRole("dialog", { name: "New category" }),
    ).toBeVisible();
    await page.getByLabel("Category name").fill(categoryName);
    await page.getByRole("button", { name: "Create category" }).click();
    await expect(page.getByText(categoryName)).toBeVisible();

    // Reload & verify category persistence
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText(categoryName)).toBeVisible();

    // Create service inside the created category
    const categoryCard = page
      .locator('[data-testid^="category-card-"]')
      .filter({ hasText: categoryName });

    await categoryCard.getByRole("button", { name: "Add service" }).click();
    await expect(
      page.getByRole("dialog", { name: "New service" }),
    ).toBeVisible();
    await page.getByLabel("Service name").fill(serviceName);
    await page
      .getByLabel("Description (optional)")
      .fill("E2E test description");
    await page.getByLabel("Duration (min)").fill("45");
    await page.getByLabel("Price").fill("29.50");
    await page.getByRole("button", { name: "Create service" }).click();
    await expect(page.getByText(serviceName)).toBeVisible();

    // Reload & verify service persistence
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText(serviceName)).toBeVisible();
    await expect(page.getByText("45 min").first()).toBeVisible();

    // Edit category
    await page
      .getByRole("button", { name: `Actions for category ${categoryName}` })
      .click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByLabel("Category name").fill(updatedCategoryName);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(updatedCategoryName)).toBeVisible();

    // Edit service
    await page
      .getByRole("button", { name: `Actions for ${serviceName}` })
      .click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByLabel("Service name").fill(updatedServiceName);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(updatedServiceName)).toBeVisible();

    // Search filter
    const searchBox = page.getByRole("searchbox", { name: "Search catalog" });
    await searchBox.fill(updatedServiceName);
    await expect(page.getByText(updatedServiceName)).toBeVisible();

    await searchBox.fill(`no-match-${suffix}`);
    await expect(
      page.getByRole("heading", { level: 2, name: "No results found" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear search" }).last().click();
    await expect(page.getByText(updatedServiceName)).toBeVisible();

    // Delete service
    await page
      .getByRole("button", { name: `Actions for ${updatedServiceName}` })
      .click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(
      page
        .locator('[data-testid^="service-row-"]')
        .filter({ hasText: updatedServiceName }),
    ).toBeHidden();

    // Delete category
    await page
      .getByRole("button", {
        name: `Actions for category ${updatedCategoryName}`,
      })
      .click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(
      page
        .locator('[data-testid^="category-card-"]')
        .filter({ hasText: updatedCategoryName }),
    ).toBeHidden();

    // Reload & verify cleanup
    await page.reload({ waitUntil: "networkidle" });
    await expect(
      page
        .locator('[data-testid^="category-card-"]')
        .filter({ hasText: updatedCategoryName }),
    ).toBeHidden();
  });

  test("has no WCAG 2.0/2.1 A/AA accessibility violations on /catalog", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/catalog", { waitUntil: "networkidle" });

    await expect(
      page.getByRole("heading", { level: 1, name: "Catalog" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("renders catalog workspace cleanly on mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/catalog", { waitUntil: "networkidle" });

    await expect(
      page.getByRole("heading", { level: 1, name: "Catalog" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "New category" }),
    ).toBeVisible();
    await expect(
      page.getByRole("searchbox", { name: "Search catalog" }),
    ).toBeVisible();
  });
});
