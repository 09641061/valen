import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("keeps public navigation and contact on the landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your service business, on schedule.",
  );

  const navigation = page.getByRole("navigation", { name: "Site navigation" });
  await expect(page.getByRole("button", { name: "Open site navigation" })).toBeHidden();
  await navigation.getByRole("link", { name: "The product" }).click();
  await expect(page).toHaveURL(/\/#product$/);
  await navigation.getByRole("link", { name: "How it works" }).click();
  await expect(page).toHaveURL(/\/#how-it-works$/);
  await navigation.getByRole("link", { name: "FAQ" }).click();
  await expect(page).toHaveURL(/\/#faq$/);

  const question = page.getByRole("button", {
    name: "Can a service belong to more than one category?",
  });
  await question.click();
  await expect(page.getByText(/Each service belongs to one category/)).toBeVisible();
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "false");

  await page.getByRole("main").getByRole("link", { name: "Let’s talk about your business" }).click();
  await expect(page).toHaveURL(/\/#contact$/);

  const preview = page.getByRole("group", { name: "Contact form preview" });
  await expect(preview.getByRole("button", { name: "Send request" })).toBeDisabled();
  const email = preview.getByLabel("Email address");
  await email.fill("visitor@example.com");
  await email.press("Enter");
  await expect(page).toHaveURL(/\/#contact$/);
  await expect(page.locator("form")).toHaveCount(0);
});

test("opens the mobile menu and navigates within the landing page", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("navigation", { name: "Site navigation" })).toBeHidden();
  const menu = page.getByRole("button", { name: "Open site navigation" });
  await menu.press("Enter");
  await expect(page.getByRole("menuitem", { name: "The product" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await menu.press("Enter");
  await page.getByRole("menuitem", { name: "FAQ" }).click();
  await expect(page).toHaveURL(/\/#faq$/);
  await expect(page.getByRole("menu")).toBeHidden();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("has no WCAG 2.1 A/AA violations on the landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
