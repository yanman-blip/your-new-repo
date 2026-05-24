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
 * RECOMMENDED "GO LIVE" WORKFLOW:
 *   npm run product:publish
 *   This runs full-sync with confirmation bypassed so public/ becomes
 *   the live source of truth in one command.
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
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { buildPublicProductCatalog } from "./public-product-catalog.mjs";

const STORAGE_BUCKET = "product-images";

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

function isStorageUrl(url) {
  if (!url) return false;
  return url.includes("/storage/v1/object/public/");
}

function resolveLocalPath(imageUrl) {
  // Image URLs from the catalog are like "/<folder>/<file>" — strip leading "/"
  // and decode each segment so "%20" / "%2B" → real spaces / "+".
  const segments = imageUrl
    .split("/")
    .filter(Boolean)
    .map((s) => {
      try { return decodeURIComponent(s); } catch { return s; }
    });
  return path.join(publicRoot, ...segments);
}

async function uploadImagesForProduct(client, product) {
  const gallery = Array.isArray(product.gallery) && product.gallery.length > 0
    ? product.gallery
    : product.image ? [product.image] : [];

  const newGallery = [];
  let uploaded = 0;
  let skipped = 0;

  for (const url of gallery) {
    if (isStorageUrl(url)) {
      newGallery.push(url);
      skipped++;
      continue;
    }
    const localPath = resolveLocalPath(url);
    if (!existsSync(localPath)) {
      console.warn(`    ⚠ source file missing: ${localPath}; keeping original URL`);
      newGallery.push(url);
      continue;
    }
    const filename = path.basename(localPath);
    const objectPath = `auto/${product.id}/${filename}`;
    const buffer = await readFile(localPath);
    const contentType = filename.toLowerCase().endsWith(".png") ? "image/png"
      : filename.toLowerCase().endsWith(".webp") ? "image/webp"
      : "image/jpeg";
    const { error: upErr } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(objectPath, buffer, { upsert: true, cacheControl: "31536000", contentType });
    if (upErr && !/already exists/i.test(upErr.message)) {
      throw new Error(`Upload failed for ${product.id}/${filename}: ${upErr.message}`);
    }
    const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
    if (!data?.publicUrl) {
      throw new Error(`Could not build public URL for ${product.id}/${filename}`);
    }
    newGallery.push(data.publicUrl);
    uploaded++;
  }

  return {
    product: {
      ...product,
      gallery: newGallery,
      image: newGallery[0] ?? product.image,
    },
    uploaded,
    skipped,
  };
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
  // Rows already in Supabase whose image URLs still point at the local
  // public/ folder (won't load on the deployed site). These get fixed in
  // place: re-upload images to Storage, update the row's URLs.
  const legacyRows = (existingRows ?? []).filter((row) => {
    if (!freshById.has(row.id)) return false;
    const galleryUrls = row.payload?.gallery ?? (row.image ? [row.image] : []);
    return galleryUrls.some((u) => u && !isStorageUrl(u));
  });

  console.log("");
  console.log(`  + ${newProducts.length} new (will be inserted)`);
  console.log(`  ⤴ ${legacyRows.length} existing with local-only image URLs (will be migrated to Storage)`);
  console.log(`  · ${freshProducts.length - newProducts.length - legacyRows.length} already on Storage (left untouched)`);
  console.log(`  · ${(existingRows ?? []).filter((p) => !freshById.has(p.id)).length} in Supabase but not in public/ (left untouched)`);

  if (newProducts.length === 0 && legacyRows.length === 0) {
    console.log("\n✓ Nothing to add or migrate. All products are on Storage already.");
    process.exit(0);
  }

  if (newProducts.length > 0) {
    console.log("\n  NEW:");
    for (const p of newProducts.slice(0, 20)) console.log(`    + ${p.id}  $${p.price}  ${(p.name ?? "").slice(0, 60)}`);
    if (newProducts.length > 20) console.log(`    … and ${newProducts.length - 20} more`);
  }
  if (legacyRows.length > 0) {
    console.log("\n  MIGRATE TO STORAGE:");
    for (const p of legacyRows.slice(0, 20)) console.log(`    ⤴ ${p.id}  ${(p.name ?? "").slice(0, 60)}`);
    if (legacyRows.length > 20) console.log(`    … and ${legacyRows.length - 20} more`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] Stopping before Supabase write. Re-run without --dry-run to apply.");
    process.exit(0);
  }

  // ── Insert new products (uploading their images to Storage first)
  if (newProducts.length > 0) {
    console.log(`\n→ Uploading + inserting ${newProducts.length} new product(s)`);
    const rows = [];
    for (const product of newProducts) {
      console.log(`  · ${product.id}`);
      const { product: ready, uploaded, skipped } = await uploadImagesForProduct(client, product);
      console.log(`      uploaded ${uploaded}, already on Storage ${skipped}`);
      rows.push({
        id: ready.id,
        name: ready.name,
        brand: ready.brand,
        price: ready.price,
        image: ready.image,
        is_published: true,
        payload: ready,
      });
    }
    const { error: insertError } = await client.from("products").insert(rows);
    if (insertError) {
      console.error(`✗ Insert failed: ${insertError.message}`);
      process.exit(1);
    }
    console.log(`  ✓ Inserted ${rows.length} new product(s).`);
  }

  // ── Backfill legacy rows: upload images + update URLs in place
  if (legacyRows.length > 0) {
    console.log(`\n→ Migrating ${legacyRows.length} legacy product(s) to Storage`);
    for (const row of legacyRows) {
      console.log(`  · ${row.id}`);
      const source = row.payload ?? { id: row.id, name: row.name, image: row.image, gallery: [] };
      const { product: ready, uploaded, skipped } = await uploadImagesForProduct(client, source);
      console.log(`      uploaded ${uploaded}, already on Storage ${skipped}`);
      const { error: updateError } = await client
        .from("products")
        .update({ image: ready.image, payload: ready })
        .eq("id", row.id);
      if (updateError) {
        console.error(`    ✗ Update failed: ${updateError.message}`);
        process.exit(1);
      }
    }
    console.log(`  ✓ Migrated ${legacyRows.length} row(s).`);
  }

  console.log("\n✓ Done. Live site will pick up the changes within a few seconds.");
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
