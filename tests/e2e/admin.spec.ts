import { test, expect } from "@playwright/test";

/**
 * Admin happy path.
 *
 * Skipped by default because it requires:
 *   - Supabase env vars (VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
 *   - A test admin user whose credentials are exposed via:
 *       PLAYWRIGHT_ADMIN_EMAIL
 *       PLAYWRIGHT_ADMIN_PASSWORD
 *
 * Run it with `PLAYWRIGHT_ADMIN_EMAIL=... PLAYWRIGHT_ADMIN_PASSWORD=... npm run test:e2e`.
 */

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

test.describe("admin portal", () => {
  test.skip(!adminEmail || !adminPassword, "Set PLAYWRIGHT_ADMIN_EMAIL/PASSWORD to enable");

  test("login redirects to dashboard and shows tabs", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/email/i).fill(adminEmail!);
    await page.getByLabel(/password/i).fill(adminPassword!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL(/\/admin\/dashboard/);
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /products/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /orders/i })).toBeVisible();
  });

  test("products tab shows table with search", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/email/i).fill(adminEmail!);
    await page.getByLabel(/password/i).fill(adminPassword!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/admin\/dashboard/);

    await page.getByRole("link", { name: /products/i }).click();
    await page.waitForURL(/\/admin\/products/);

    await expect(page.getByPlaceholder(/search products/i)).toBeVisible();
    // Add Product button should open the slide-over.
    await page.getByRole("button", { name: /add product/i }).click();
    await expect(page.getByRole("heading", { name: /add product/i })).toBeVisible();
  });
});
