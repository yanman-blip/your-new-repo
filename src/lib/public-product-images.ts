import {
  productFolderGalleryManifest as legacyProductFolderGalleryManifest,
  type ProductFolderGalleryManifest,
} from "@/lib/product-folder-galleries";
import { publicProductGalleryManifest, publicProductVariantManifest } from "@/lib/public-product-images.generated";
import { productVariantManifest as legacyProductVariantManifest, type ProductVariantManifest } from "@/lib/product-variants";

function toLookupToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .trim();
}

function getDecodedPathSegments(imagePath: string): string[] {
  try {
    const pathname = imagePath.startsWith("http") ? new URL(imagePath).pathname : imagePath;
    return pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      });
  } catch {
    return imagePath
      .split("/")
      .filter(Boolean)
      .map((segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      });
  }
}

function getProductImageRelativeSegments(imagePath: string): string[] {
  const parts = getDecodedPathSegments(imagePath);
  const bucketIndex = parts.findIndex((part) => part === "product-images");
  if (bucketIndex >= 0) return parts.slice(bucketIndex + 1);
  return parts;
}

function getManifestKeyByToken(candidates: string[], keys: string[]): string | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (keys.includes(candidate)) return candidate;
  }

  const keyedTokens = new Map(keys.map((key) => [toLookupToken(key), key]));
  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = keyedTokens.get(toLookupToken(candidate));
    if (match) return match;
  }

  return null;
}

function detectColorFromImagePath(imagePath: string): string | null {
  const parts = getProductImageRelativeSegments(imagePath);
  if (parts.length < 3) return null;
  return parts[1] ?? null;
}

export const resolvedProductFolderGalleryManifest: ProductFolderGalleryManifest = {
  ...legacyProductFolderGalleryManifest,
  ...publicProductGalleryManifest,
};

export const resolvedProductVariantManifest: ProductVariantManifest = Object.fromEntries(
  Array.from(new Set([...Object.keys(legacyProductVariantManifest), ...Object.keys(publicProductVariantManifest)])).map((key) => [
    key,
    {
      ...(legacyProductVariantManifest[key] ?? {}),
      ...(publicProductVariantManifest[key] ?? {}),
    },
  ]),
);

export function getLocalProductImageOverride(productName: string, imagePath: string): { image: string; gallery: string[] } | null {
  const relativeParts = getProductImageRelativeSegments(imagePath);
  const imageFolder = relativeParts[0] ?? "";
  const manifestKeys = Array.from(
    new Set([...Object.keys(publicProductGalleryManifest), ...Object.keys(publicProductVariantManifest)]),
  );
  const manifestKey = getManifestKeyByToken([productName, imageFolder], manifestKeys);
  if (!manifestKey) return null;

  const localVariants = publicProductVariantManifest[manifestKey] ?? {};
  const variantEntries = Object.entries(localVariants);
  const detectedColor = detectColorFromImagePath(imagePath);
  if (variantEntries.length > 0) {
    const matchedVariant = variantEntries.find(([variantName]) => toLookupToken(variantName) === toLookupToken(detectedColor ?? ""));
    if (matchedVariant && matchedVariant[1].length > 0) {
      return {
        image: matchedVariant[1][0],
        gallery: matchedVariant[1],
      };
    }

    const firstVariant = variantEntries.find(([, images]) => images.length > 0);
    if (firstVariant) {
      return {
        image: firstVariant[1][0],
        gallery: firstVariant[1],
      };
    }
  }

  const localGallery = publicProductGalleryManifest[manifestKey] ?? [];
  if (localGallery.length > 0) {
    return {
      image: localGallery[0],
      gallery: localGallery,
    };
  }

  return null;
}