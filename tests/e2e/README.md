# End-to-end tests

Playwright tests for the WET LACE storefront and admin portal.

## First-time setup

Install the browser binaries (one-time, ~150MB):

```bash
npm run test:e2e:install
```

## Running

```bash
# Headless, with auto-started dev server
npm run test:e2e

# With the Playwright UI (great for debugging selectors)
npm run test:e2e:ui

# Against a deployed URL instead of the local dev server
PLAYWRIGHT_BASE_URL=https://wetlace.com npm run test:e2e
```

## What's covered

- **`storefront.spec.ts`** — homepage → shop → product detail → add to cart → reach checkout. Runs against the dev server with no backend mocking (uses the seeded `baseProducts`).
- **`admin.spec.ts`** — login → dashboard → products tab → open the add-product slide-over. **Skipped by default**; set `PLAYWRIGHT_ADMIN_EMAIL` and `PLAYWRIGHT_ADMIN_PASSWORD` to enable.

## What's NOT covered yet

- Real proof upload (needs Supabase storage write + bucket policy).
- Real admin approve (needs an order in `awaiting_admin_approval` state).
- Order detail drawer interactions.

These are intentionally left out until we have a dedicated test admin account + a way to seed test orders before each run.
