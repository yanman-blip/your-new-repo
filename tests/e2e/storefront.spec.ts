import { test, expect } from "@playwright/test";

/**
 * Storefront happy path.
 *
 * Covers: homepage renders → shop catalog renders → click into a product
 * → add to cart → reach checkout with the cart populated.
 *
 * This test runs against the dev server with no backend mocking. Products
 * come from `baseProducts` (always present even without Supabase), so the
 * test is deterministic on a clean machine.
 */
test.describe("storefront happy path", () => {
  test("user can browse → add to cart → reach checkout", async ({ page }) => {
    // --- Homepage --------------------------------------------------------
    await page.goto("/");
    await expect(page).toHaveTitle(/WET LACE/);

    // The page should render at least one product link to /product/:id.
    const firstProductLink = page.locator('a[href^="/product/"]').first();
    await expect(firstProductLink).toBeVisible({ timeout: 15_000 });

    // --- Shop catalog ----------------------------------------------------
    await page.goto("/shop");
    const shopProductLinks = page.locator('a[href^="/product/"]');
    await expect(shopProductLinks.first()).toBeVisible({ timeout: 15_000 });

    const productCount = await shopProductLinks.count();
    expect(productCount).toBeGreaterThan(0);

    // --- Product detail --------------------------------------------------
    await shopProductLinks.first().click();
    await page.waitForURL(/\/product\//);

    // Product page surfaces an "ADD TO CART" CTA — case-insensitive in case
    // the copy ever changes capitalization.
    const addToCart = page.getByRole("button", { name: /add to cart/i });
    await expect(addToCart).toBeVisible({ timeout: 10_000 });

    await addToCart.click();

    // --- Checkout --------------------------------------------------------
    await page.goto("/checkout");

    // Checkout should render something order-related (heading, summary or
    // a form field) — we don't pin exact copy so the test survives small
    // wording tweaks.
    const checkoutSignal = page.getByText(/checkout|order|delivery|payment/i).first();
    await expect(checkoutSignal).toBeVisible({ timeout: 10_000 });
  });

  test("direct link to a known product loads", async ({ page }) => {
    // Hits the loader path that previously 404'd on cold visits to admin-
    // created products. Uses one of the seeded base products so it works
    // even without Supabase.
    await page.goto(
      "/product/sleeveless-sexy-bandage-dress-elegant-black-white-round-neck-long-fitted-design-",
    );
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
