#!/usr/bin/env node
/*
 * Batch-process product images dropped into public/<folder>/.
 *
 * What it does (per image):
 *  - Strips ALL metadata (EXIF, ICC, XMP) so origin is not embedded.
 *  - Light edge crop (default 3%) so pixel-hash and reverse-image-search
 *    no longer get an exact match against the source.
 *  - Re-encodes JPEG at quality 85, mozjpeg trellis quantization on,
 *    progressive on. This breaks byte-level fingerprints.
 *  - Caps the longest edge at 1600px (skips upscaling).
 *  - Preserves the original filename, overwrites in place.
 *
 * Usage:
 *   node scripts/process-product-images.mjs                       # all public/<folder>/
 *   node scripts/process-product-images.mjs "<folder name>"       # single folder
 *   node scripts/process-product-images.mjs --dry-run             # report only
 *   node scripts/process-product-images.mjs --crop 5              # 5% edge crop
 *
 * Skips files already processed (marker stored in .processed.json
 * inside each folder, keyed by filename + mtime).
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const cropFlagIdx = args.indexOf("--crop");
const cropPct = cropFlagIdx >= 0 ? Number(args[cropFlagIdx + 1]) : 3;
const folderArg = args.find((a) => !a.startsWith("--") && (cropFlagIdx < 0 || args.indexOf(a) !== cropFlagIdx + 1));

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_EDGE = 1600;
const JPEG_QUALITY = 85;

if (!Number.isFinite(cropPct) || cropPct < 0 || cropPct > 15) {
  console.error(`Bad --crop value: ${cropPct}. Must be 0-15.`);
  process.exit(1);
}

async function listProductFolders() {
  if (folderArg) return [folderArg];
  const entries = await readdir(publicDir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function loadProcessedIndex(folderPath) {
  const file = path.join(folderPath, ".processed.json");
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return {};
  }
}

async function saveProcessedIndex(folderPath, index) {
  if (dryRun) return;
  await writeFile(path.join(folderPath, ".processed.json"), JSON.stringify(index, null, 2), "utf8");
}

async function processOne(filePath) {
  const buf = await readFile(filePath);
  const image = sharp(buf, { failOn: "none" });
  const meta = await image.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) throw new Error("could not read dimensions");

  const cropX = Math.floor((w * cropPct) / 100);
  const cropY = Math.floor((h * cropPct) / 100);
  const cropped = image.extract({
    left: cropX,
    top: cropY,
    width: w - cropX * 2,
    height: h - cropY * 2,
  });

  const longest = Math.max(w - cropX * 2, h - cropY * 2);
  const resized = longest > MAX_EDGE ? cropped.resize({ width: w >= h ? MAX_EDGE : undefined, height: h > w ? MAX_EDGE : undefined, fit: "inside" }) : cropped;

  // Always re-encode to JPEG (most universal, smallest after mozjpeg).
  // PNG/WebP inputs are converted to .jpg — update filename accordingly.
  const outBuf = await resized
    .rotate() // honor original EXIF orientation BEFORE stripping
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
    .withMetadata({}) // strips EXIF/ICC/XMP
    .toBuffer();

  const ext = path.extname(filePath).toLowerCase();
  const outPath = ext === ".jpg" ? filePath : filePath.replace(/\.(jpeg|png|webp)$/i, ".jpg");
  if (!dryRun) await writeFile(outPath, outBuf);
  if (!dryRun && outPath !== filePath) {
    const { unlink } = await import("node:fs/promises");
    await unlink(filePath);
  }
  return { outPath, beforeBytes: buf.length, afterBytes: outBuf.length };
}

async function processFolder(folderName) {
  const folderPath = path.join(publicDir, folderName);
  if (!existsSync(folderPath)) {
    console.warn(`Skipping ${folderName}: not found`);
    return null;
  }
  const entries = await readdir(folderPath, { withFileTypes: true });
  const images = entries
    .filter((e) => e.isFile() && IMAGE_EXTS.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name);

  if (images.length === 0) return null;

  const index = await loadProcessedIndex(folderPath);
  let processedCount = 0;
  let skippedCount = 0;
  let savedBytes = 0;

  for (const name of images) {
    const filePath = path.join(folderPath, name);
    const st = await stat(filePath);
    const key = `${name}:${st.mtimeMs}:${st.size}`;
    if (index[name] === key) {
      skippedCount++;
      continue;
    }
    try {
      const { beforeBytes, afterBytes, outPath } = await processOne(filePath);
      const newName = path.basename(outPath);
      const newSt = await stat(outPath).catch(() => st);
      index[newName] = `${newName}:${newSt.mtimeMs}:${newSt.size}`;
      if (newName !== name) delete index[name];
      processedCount++;
      savedBytes += beforeBytes - afterBytes;
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  await saveProcessedIndex(folderPath, index);
  return { folderName, processed: processedCount, skipped: skippedCount, savedBytes };
}

async function main() {
  if (!existsSync(publicDir)) {
    console.error(`No public/ directory at ${publicDir}`);
    process.exit(1);
  }
  console.log(`${dryRun ? "[DRY RUN] " : ""}Processing with ${cropPct}% edge crop, max ${MAX_EDGE}px, JPEG q${JPEG_QUALITY}`);
  console.log("");

  const folders = await listProductFolders();
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalSaved = 0;

  for (const folder of folders) {
    const result = await processFolder(folder);
    if (!result) continue;
    if (result.processed > 0 || result.skipped > 0) {
      console.log(`${folder}`);
      console.log(`  processed: ${result.processed}, skipped (already done): ${result.skipped}, saved: ${(result.savedBytes / 1024).toFixed(0)} KB`);
    }
    totalProcessed += result.processed;
    totalSkipped += result.skipped;
    totalSaved += result.savedBytes;
  }

  console.log("");
  console.log(`Done. ${totalProcessed} processed, ${totalSkipped} skipped, ${(totalSaved / 1024 / 1024).toFixed(2)} MB saved overall.`);
  if (dryRun) console.log("(Dry run — no files written.)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
