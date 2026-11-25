import AxeBuilder from "@axe-core/playwright";
import { expect, request as playwrightRequest, test } from "@playwright/test";

const CYNTHIA_API_URL = process.env.CYNTHIA_API_URL ?? "http://127.0.0.1:8081";

test.describe("CRM customers against live Cynthia backend", () => {
  const createdPhones: string[] = [];

  test.afterEach(async () => {
    if (createdPhones.length === 0) return;
    const api = await playwrightRequest.newContext();
    try {
      for (const phone of createdPhones) {
        const res = await api.get(
          `${CYNTHIA_API_URL}/v1/customers?q=${encodeURIComponent(phone)}`,
        );
        if (!res.ok()) continue;
        const body = (await res.json()) as {
          items?: Array<{ id: string; phone: string }>;
        };
        for (const item of body.items ?? []) {
          if (item.phone === phone) {
            await api.delete(`${CYNTHIA_API_URL}/v1/customers/${item.id}`);
          }
        }
      }
    } finally {
      createdPhones.length = 0;
      await api.dispose();
    }
  });

  test("full CRUD and duplicate-phone conflict flow on /customers", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const suffix = String(Date.now()).slice(-8);
    const phone = `+5255${suffix}`;
    const customerName = `Customer E2E ${suffix}`;
    const updatedName = `Customer Edited ${suffix}`;
    createdPhones.push(phone);

    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/customers", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { level: 1, name: "Customers" }),
    ).toBeVisible();

    // Create customer
    await page.getByRole("button", { name: "Add customer" }).click();
    const createDialog = page.getByRole("dialog", { name: "Add customer" });
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel("Name").fill(customerName);
    await createDialog.getByLabel("Phone").fill(phone);
    await createDialog.getByRole("button", { name: "Add customer" }).click();
    await expect(createDialog).toBeHidden();
    await expect(page.getByText(customerName).first()).toBeVisible();

    // Reload and verify persistence + search by name/phone
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: "Customers" }),
    ).toBeVisible();

    const searchBox = page.getByRole("searchbox", {
      name: "Search by name or phone",
    });
    await searchBox.fill(phone);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText(customerName).first()).toBeVisible();
    await expect(page.getByText(phone).first()).toBeVisible();

    // Duplicate phone creation triggers 409 existing_customer conflict banner
    await page.getByRole("button", { name: "Add customer" }).click();
    const dupDialog = page.getByRole("dialog", { name: "Add customer" });
    await expect(dupDialog).toBeVisible();
    await dupDialog.getByLabel("Name").fill(`Duplicate ${suffix}`);
    await dupDialog.getByLabel("Phone").fill(phone);
    await dupDialog.getByRole("button", { name: "Add customer" }).click();

    await expect(
      dupDialog.getByText("A customer with this phone already exists"),
    ).toBeVisible();
    await expect(
      dupDialog.getByText(`${customerName} (${phone})`),
    ).toBeVisible();
    await dupDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dupDialog).toBeHidden();

    // Edit customer
    await page
      .getByRole("button", { name: `Actions for ${customerName}` })
      .click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    const editDialog = page.getByRole("dialog", { name: "Edit customer" });
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel("Name").fill(updatedName);
    await editDialog.getByRole("button", { name: "Save changes" }).click();
    await expect(editDialog).toBeHidden();
    await expect(page.getByText(updatedName).first()).toBeVisible();

    // Delete customer
    await page
      .getByRole("button", { name: `Actions for ${updatedName}` })
      .click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const deleteDialog = page.getByRole("alertdialog", {
      name: "Delete customer",
    });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Delete" }).click();
    await expect(deleteDialog).toBeHidden();

    // Reload and verify removal
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: "Customers" }),
    ).toBeVisible();
    await expect(page.getByText(updatedName)).toBeHidden();
  });

  test("has no WCAG 2.0/2.1 A/AA accessibility violations on /customers", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/customers", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { level: 1, name: "Customers" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
