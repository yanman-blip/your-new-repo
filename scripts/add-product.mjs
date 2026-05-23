#!/usr/bin/env node
/*
 * Add new products from public/<folder>/ to Supabase.
 *
 * DEFAULT MODE: additive — only inserts products whose id does NOT already
 * exist in Supabase. Existing rows are untouched, so any edits you made in
 * the admin dashboard are preserved.
 *
 *   1. images:process       — strip EXIF, re-encode, edge-crop
 *   2. regenerate manifest  — write src/lib/public-products.generated.ts
 *   3. insert NEW rows only — never wipes, never updates existing rows
 *
 * FULL-SYNC MODE (--full-sync): destructive — wipes the products table
 * and re-inserts everything from public/. Use this when you've renamed
 * folders, removed products, or want public/ to be the absolute source
 * of truth. Guarded with a diff + --yes confirmation.
 *
 * Usage:
 *   node scripts/add-product.mjs                  # additive (safe default)
 *   node scripts/add-product.mjs --dry-run        # preview, no writes
 *   node scripts/add-product.mjs --full-sync      # destructive resync (diff + --yes guard)
 *   node scripts/add-product.mjs --full-sync --yes   # bypass guard
 *   node scripts/add-product.mjs --skip-images    # don't re-run image processor
 *   node scripts/add-product.mjs --skip-manifest  # don't regenerate TS files
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { buildPublicProductCatalog } from "./public-product-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(repoRoot, "public");

const args = process.argv.slice(2);
const yes = args.includes("--yes");
const dryRun = args.includes("--dry-run");
const fullSync = args.includes("--full-sync");
// Dry-run implies skipping the file-mutating steps too — a true preview.
const skipImages = args.includes("--skip-images") || dryRun;
const skipManifest = args.includes("--skip-manifest") || dryRun;

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run via `npm run product:add` so .env loads automatically.");
  process.exit(1);
}

function runNodeStep(label, scriptArgs) {
  console.log(`\n→ ${label}`);
  const result = spawnSync(process.execPath, scriptArgs, { stdio: "inherit", cwd: repoRoot });
  if (result.status !== 0) {
    console.error(`✗ ${label} failed (exit ${result.status}). Aborting.`);
    process.exit(result.status ?? 1);
  }
}

function fmt(value) {
  if (value === null || value === undefined || value === "") return "∅";
  return String(value);
}

if (!skipImages) {
  runNodeStep("Processing images (de-fingerprint)", ["scripts/process-product-images.mjs"]);
} else {
  console.log(`→ Skipping image processing${dryRun ? " (dry-run)" : " (--skip-images)"}`);
}

if (!skipManifest) {
  runNodeStep("Regenerating TS manifest", ["scripts/generate-public-product-manifest.mjs"]);
} else {
  console.log(`→ Skipping manifest regeneration${dryRun ? " (dry-run)" : " (--skip-manifest)"}`);
}

console.log(`\n→ Reading Supabase (${fullSync ? "FULL SYNC mode" : "additive mode"})`);

const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
});

const { data: existingRows, error: fetchError } = await client
  .from("products")
  .select("id, name, price, image, payload");
if (fetchError) {
  console.error(`✗ Could not read products from Supabase: ${fetchError.message}`);
  process.exit(1);
}

const { products: freshProducts } = await buildPublicProductCatalog(publicRoot);
if (freshProducts.length === 0) {
  console.error("✗ No products found under public/. Aborting.");
  process.exit(1);
}

const existingById = new Map((existingRows ?? []).map((p) => [p.id, p]));
const freshById = new Map(freshProducts.map((p) => [p.id, p]));

// ─────────────────────────────────────────────────────────────────────────
// ADDITIVE MODE (default)
// ─────────────────────────────────────────────────────────────────────────
if (!fullSync) {
  const newProducts = freshProducts.filter((p) => !existingById.has(p.id));

  console.log("");
  console.log(`  + ${newProducts.length} new (will be inserted)`);
  console.log(`  · ${freshProducts.length - newProducts.length} already in Supabase (left untouched)`);
  console.log(`  · ${(existingRows ?? []).filter((p) => !freshById.has(p.id)).length} in Supabase but not in public/ (left untouched)`);

  if (newProducts.length === 0) {
    console.log("\n✓ Nothing to add. All public/ products are already in Supabase.");
    process.exit(0);
  }

  console.log("\n  NEW:");
  for (const p of newProducts.slice(0, 20)) console.log(`    + ${p.id}  $${p.price}  ${(p.name ?? "").slice(0, 60)}`);
  if (newProducts.length > 20) console.log(`    … and ${newProducts.length - 20} more`);

  if (dryRun) {
    console.log("\n[DRY RUN] Stopping before Supabase write. Re-run without --dry-run to insert.");
    process.exit(0);
  }

  console.log(`\n→ Inserting ${newProducts.length} new product(s)`);
  const rows = newProducts.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: product.image,
    is_published: true,
    payload: product,
  }));
  const { error: insertError } = await client.from("products").insert(rows);
  if (insertError) {
    console.error(`✗ Insert failed: ${insertError.message}`);
    process.exit(1);
  }

  console.log(`\n✓ Added ${rows.length} new product(s). Existing rows untouched.`);
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────
// FULL-SYNC MODE (--full-sync) — destructive
// ─────────────────────────────────────────────────────────────────────────
console.log("\n→ Diffing public/ against Supabase (full-sync mode)");

const added = freshProducts.filter((p) => !existingById.has(p.id));
const removed = (existingRows ?? []).filter((p) => !freshById.has(p.id));
const changed = [];
for (const f of freshProducts) {
  const e = existingById.get(f.id);
  if (!e) continue;
  const eBadge = e.payload?.badge;
  const diffs = [];
  if (Number(e.price) !== Number(f.price)) diffs.push(`price ${fmt(e.price)} → ${fmt(f.price)}`);
  if (e.name !== f.name) diffs.push(`name "${fmt(e.name)}" → "${fmt(f.name)}"`);
  if (eBadge !== f.badge) diffs.push(`badge ${fmt(eBadge)} → ${fmt(f.badge)}`);
  if (diffs.length > 0) changed.push({ id: f.id, name: f.name, diffs });
}

console.log("");
console.log(`  + ${added.length} new`);
console.log(`  ! ${changed.length} changed (likely admin edits about to be overwritten)`);
console.log(`  − ${removed.length} removed (in Supabase but not in public/)`);

if (added.length > 0) {
  console.log("\n  NEW:");
  for (const p of added.slice(0, 10)) console.log(`    + ${p.id}  $${p.price}  ${(p.name ?? "").slice(0, 60)}`);
  if (added.length > 10) console.log(`    … and ${added.length - 10} more`);
}
if (changed.length > 0) {
  console.log("\n  CHANGES THAT WILL BE OVERWRITTEN BY public/:");
  for (const c of changed.slice(0, 20)) {
    console.log(`    ! ${c.id}  (${(c.name ?? "").slice(0, 50)})`);
    for (const d of c.diffs) console.log(`        ${d}`);
  }
  if (changed.length > 20) console.log(`    … and ${changed.length - 20} more`);
}
if (removed.length > 0) {
  console.log("\n  ROWS THAT WILL BE DELETED FROM SUPABASE:");
  for (const p of removed.slice(0, 10)) console.log(`    − ${p.id}  ${(p.name ?? "").slice(0, 60)}`);
  if (removed.length > 10) console.log(`    … and ${removed.length - 10} more`);
}

const destructive = changed.length > 0 || removed.length > 0;

if (dryRun) {
  console.log("\n[DRY RUN] Stopping before Supabase write. Re-run without --dry-run to apply.");
  process.exit(0);
}

if (destructive && !yes) {
  console.log("\n✗ Destructive changes detected. Pass --yes to confirm, or drop --full-sync to add new products only.");
  process.exit(2);
}

runNodeStep("Syncing to Supabase (destructive wipe + re-insert)", ["--env-file=.env", "scripts/sync-public-products-to-supabase.mjs"]);

console.log("\n✓ Full sync complete. Live site will update within a few seconds.");
