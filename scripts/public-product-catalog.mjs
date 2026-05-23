import { readdir } from "node:fs/promises";
import path from "node:path";

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

const colorHexMap = {
  black: "#1c1c1e",
  white: "#f5f3ee",
  red: "#aa1b2a",
  pink: "#f3c4cd",
  burgundy: "#7b1f2b",
  blue: "#2c4f9e",
  green: "#4f6f52",
  grey: "#7d7d82",
  gray: "#7d7d82",
  cream: "#ece4d6",
  brown: "#7a5230",
};

function comparePaths(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 84);
}

function toDisplayColorName(raw) {
  return raw
    .toLowerCase()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hashValue(value) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) & 0xffffffff;
  return Math.abs(hash);
}

function inferBrand(name) {
  const lower = name.toLowerCase();
  if (/(yoga|leggings|pants|office|commute|casual|everyday)/.test(lower)) return "Everyday";
  if (/(silk|satin|lounge|sleep|nightwear)/.test(lower)) return "Lounge";
  return "Lace";
}

function inferPrice(name) {
  return 12 + (hashValue(name) % 7);
}

function inferHighlights(name, variantCount) {
  const lower = name.toLowerCase();
  const highlights = ["Curated from your uploaded public assets", "Comfort-forward fit"];
  if (variantCount > 1) highlights.push("Available in multiple color options");
  if (/(bridal|valentine|romantic)/.test(lower)) highlights.push("Boutique occasion styling");
  else if (/(office|commute|everyday|yoga|fitness)/.test(lower)) highlights.push("Easy daily rotation piece");
  else highlights.push("Boutique catalog styling");
  return highlights;
}

function inferColors(productName, variants) {
  const variantNames = Object.keys(variants);
  if (variantNames.length > 0) {
    return variantNames.map((variantName) => {
      const key = variantName.toLowerCase();
      return {
        name: toDisplayColorName(variantName),
        hex: colorHexMap[key] ?? "#1c1c1e",
      };
    });
  }

  const lower = productName.toLowerCase();
  if (lower.includes("white")) return [{ name: "White", hex: colorHexMap.white }];
  if (lower.includes("red")) return [{ name: "Red", hex: colorHexMap.red }];
  return [{ name: "Black", hex: colorHexMap.black }];
}

async function listFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!allowedExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    files.push(path.join(dirPath, entry.name));
  }

  return files.sort(comparePaths);
}

export async function buildPublicProductCatalog(publicRoot) {
  const galleries = {};
  const variants = {};
  const products = [];
  const productEntries = await readdir(publicRoot, { withFileTypes: true });

  for (const entry of productEntries) {
    if (!entry.isDirectory()) continue;

    const productName = entry.name;
    const productDir = path.join(publicRoot, productName);
    const childEntries = await readdir(productDir, { withFileTypes: true });
    const galleryFiles = [];
    const variantGroups = {};

    for (const child of childEntries) {
      const childPath = path.join(productDir, child.name);
      if (child.isFile()) {
        if (allowedExtensions.has(path.extname(child.name).toLowerCase())) {
          galleryFiles.push(`/${toPosixPath(path.relative(publicRoot, childPath))}`);
        }
        continue;
      }

      if (!child.isDirectory()) continue;
      const variantFiles = (await listFiles(childPath)).map((filePath) => `/${toPosixPath(path.relative(publicRoot, filePath))}`);
      if (variantFiles.length > 0) variantGroups[child.name] = variantFiles;
    }

    const sortedGallery = galleryFiles.sort(comparePaths);
    const sortedVariantNames = Object.keys(variantGroups).sort(comparePaths);
    const sortedVariants = Object.fromEntries(sortedVariantNames.map((variantName) => [variantName, variantGroups[variantName]]));

    if (sortedGallery.length > 0) galleries[productName] = sortedGallery;
    if (sortedVariantNames.length > 0) variants[productName] = sortedVariants;

    const primaryGallery = sortedGallery.length > 0 ? sortedGallery : sortedVariantNames.flatMap((variantName) => sortedVariants[variantName]);
    if (primaryGallery.length === 0) continue;

    products.push({
      id: slugify(productName),
      name: productName,
      brand: inferBrand(productName),
      price: inferPrice(productName),
      image: primaryGallery[0],
      gallery: primaryGallery,
      storage: ["S", "M", "L", "XL"],
      colors: inferColors(productName, sortedVariants),
      highlights: inferHighlights(productName, sortedVariantNames.length),
      badge: hashValue(productName) % 5 === 0 ? "New" : undefined,
    });
  }

  products.sort((a, b) => comparePaths(a.name, b.name));

  return { galleries, variants, products };
}