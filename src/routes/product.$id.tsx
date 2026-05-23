import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { fetchProductById, getProduct, products, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { formatPrice, formatOldPrice } from "@/lib/format-price";
import { resolvedProductFolderGalleryManifest, resolvedProductVariantManifest } from "@/lib/public-product-images";
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, Heart, Star, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useWishlist } from "@/lib/wishlist";
import { markProductRecentlyViewed, useRecentlyViewedProducts } from "@/lib/recently-viewed";
import { trackRecommendationClick, trackRecommendationImpression } from "@/lib/recommendation-analytics";
import { createProductReview, fetchProductReviews, type ProductReviewFit } from "@/lib/product-reviews";

const colorClassMap: Record<string, string> = {
  Blush: "bg-[#f3c4cd]",
  Champagne: "bg-[#e9d8b8]",
  Noir: "bg-[#1c1c1e]",
  Pearl: "bg-[#ece4d6]",
  Bordeaux: "bg-[#5a1f2a]",
  Ivory: "bg-[#f3ead8]",
  Sage: "bg-[#bccdb6]",
  Sand: "bg-[#dccdb6]",
  Black: "bg-[#1c1c1e]",
  Ivoire: "bg-[#f1e7d3]",
  Red: "bg-[#aa1b2a]",
  Pink: "bg-[#f3c4cd]",
  Burgundy: "bg-[#7b1f2b]",
  Blue: "bg-[#2c4f9e]",
  "Dark Blue": "bg-[#1d2f5f]",
  White: "bg-[#f6f6f2]",
};

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    let product = getProduct(params.id);
    if (!product) {
      // Cache miss — fall back to cloud (admin may have created/edited this
      // since the last cache fill). This makes direct product links work
      // even on a first-time visit.
      product = (await fetchProductById(params.id)) ?? undefined;
    }
    if (!product) throw notFound();
    return { product: product as NonNullable<ReturnType<typeof getProduct>> };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.product.name} - WET LACE` },
            { name: "description", content: loaderData.product.description },
            { property: "og:title", content: loaderData.product.name },
            { property: "og:description", content: loaderData.product.description },
            { property: "og:image", content: loaderData.product.image },
          ],
        }
      : {},
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">Piece not found</h1>
      <Link to="/shop" className="mt-6 inline-block underline underline-offset-4">Back to shop</Link>
    </div>
  ),
  component: ProductPage,
});

type CustomerReview = {
  id: string;
  name: string;
  rating: number;
  date: string;
  fit: "True to size" | "Small" | "Large";
  size: string;
  text: string;
  photos: string[];
  verified: boolean;
  helpful: number;
};

type ReviewSort = "helpful" | "newest" | "highest" | "lowest";
type ReviewFilter = "all" | "with-photos" | "5-star" | "4-star" | "true-to-size";

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildReviews(gallery: string[]): CustomerReview[] {
  const safeGallery = gallery.length > 0 ? gallery : ["/pexels-foundertips-5218948.jpg"];
  return [
    {
      id: "r1",
      name: "Tanya M.",
      rating: 5,
      date: "14 May 2025",
      fit: "True to size",
      size: "L",
      text: "Absolutely stunning. The lace quality is premium and the fit is perfect. I ordered my usual size and it hugged all the right places. Delivery was fast and the packaging felt like a real luxury brand experience. Will definitely be ordering more.",
      photos: safeGallery.slice(0, 2),
      verified: true,
      helpful: 24,
    },
    {
      id: "r2",
      name: "Priya K.",
      rating: 5,
      date: "09 Feb 2025",
      fit: "True to size",
      size: "S",
      text: "I was skeptical ordering online but this exceeded every expectation. The fabric feels genuinely luxurious against the skin and the stitching is immaculate. This is now my go-to for special occasions — I\'ve already recommended it to three friends.",
      photos: safeGallery.slice(1, 3),
      verified: true,
      helpful: 18,
    },
    {
      id: "r3",
      name: "Rudo N.",
      rating: 4,
      date: "03 Jan 2025",
      fit: "Small",
      size: "M",
      text: "Really beautiful piece. The colour is exactly as shown in the photos. I would size up if you prefer a relaxed fit — it runs slightly small. Otherwise the quality is excellent and the detail work is impressive for the price point.",
      photos: safeGallery.slice(2, 4),
      verified: true,
      helpful: 12,
    },
  ];
}

function getStockHint(id: string): { count: number; urgent: boolean; label: string } {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) & 0xffffffff;
  const count = (Math.abs(hash) % 8) + 2; // 2–9
  if (count <= 3) return { count, urgent: true, label: `Only ${count} left — order soon` };
  if (count <= 6) return { count, urgent: false, label: `${count} items left in stock` };
  return { count, urgent: false, label: `${count} in stock` };
}

function getLiveShoppersHint(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 37 + char.charCodeAt(0)) & 0xffffffff;
  return (Math.abs(hash) % 14) + 7; // 7-20 shoppers
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((safe % 3600) / 60).toString().padStart(2, "0");
  const seconds = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function shortenName(name: string): string {
  return name.length > 32 ? `${name.slice(0, 29)}...` : name;
}

function getFitBreakdown(fit: "runs-small" | "true-to-size" | "runs-large") {
  if (fit === "runs-small") return { small: 58, trueToSize: 35, large: 7 };
  if (fit === "runs-large") return { small: 8, trueToSize: 40, large: 52 };
  return { small: 12, trueToSize: 80, large: 8 };
}

function getFitWidthClass(percent: number): string {
  if (percent >= 80) return "w-[80%]";
  if (percent >= 58) return "w-[58%]";
  if (percent >= 52) return "w-[52%]";
  if (percent >= 40) return "w-[40%]";
  if (percent >= 35) return "w-[35%]";
  if (percent >= 12) return "w-[12%]";
  if (percent >= 8) return "w-[8%]";
  return "w-[7%]";
}

function toDisplayColorName(raw: string): string {
  return raw
    .toLowerCase()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function toLookupToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .trim();
}

function getDecodedFilename(imagePath: string): string {
  const parts = getDecodedPathSegments(imagePath);
  return parts[parts.length - 1] ?? "";
}

function getProductImagesPublicBaseUrl(imagePath: string): string | null {
  if (!/^https?:\/\//i.test(imagePath)) return null;
  try {
    const url = new URL(imagePath);
    const objectMarker = "/storage/v1/object/public/product-images/";
    const renderMarker = "/storage/v1/render/image/public/product-images/";

    if (url.pathname.includes(renderMarker)) {
      return `${url.origin}/storage/v1/render/image/public/product-images`;
    }

    if (url.pathname.includes(objectMarker)) {
      return `${url.origin}/storage/v1/render/image/public/product-images`;
    }

    return null;
  } catch {
    return null;
  }
}

function encodeStoragePath(rawPath: string): string {
  return rawPath
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");
}

function normalizeLocalPublicPath(rawPath: string): string {
  const [pathWithLeadingSlash, searchAndHash = ""] = rawPath.split(/(?=[?#])/);
  const hasLeadingSlash = pathWithLeadingSlash.startsWith("/");
  const segments = pathWithLeadingSlash
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  return `${hasLeadingSlash ? "/" : ""}${segments.join("/")}${searchAndHash}`;
}

function toPublicProductImageUrl(
  imagePath: string,
  baseUrl: string | null,
  canonicalFolderSegment?: string,
): string {
  if (!imagePath) return imagePath;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  if (imagePath.startsWith("/")) {
    return normalizeLocalPublicPath(imagePath);
  }
  if (!baseUrl) return imagePath;

  const rawPath = imagePath.replace(/^\/+/, "");
  const segments = rawPath.split("/").filter(Boolean);
  if (canonicalFolderSegment && segments.length > 0) {
    let firstDecoded = segments[0];
    try {
      firstDecoded = decodeURIComponent(segments[0]);
    } catch {
      // use raw segment when decoding fails
    }
    if (toLookupToken(firstDecoded) === toLookupToken(canonicalFolderSegment)) {
      segments[0] = canonicalFolderSegment;
    }
  }

  const encodedPath = encodeStoragePath(segments.join("/"));
  const delimiter = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}/${encodedPath}${delimiter}quality=85&width=1200`;
}

function toNormalizedProductFolderImageUrl(imageUrl: string): string | null {
  if (!/^https?:\/\//i.test(imageUrl)) return null;

  try {
    const parsed = new URL(imageUrl);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const bucketIndex = parts.findIndex((part) => part === "product-images");
    if (bucketIndex < 0 || !parts[bucketIndex + 1]) return null;

    const decodedFolder = decodeURIComponent(parts[bucketIndex + 1]);
    const normalizedFolder = decodedFolder
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!normalizedFolder || normalizedFolder === decodedFolder) return null;

    parts[bucketIndex + 1] = normalizedFolder;
    const encodedPath = encodeStoragePath(parts.join("/"));
    return `${parsed.origin}/${encodedPath}`;
  } catch {
    return null;
  }
}

function tryImageNormalizedFallback(img: HTMLImageElement): boolean {
  const currentSrc = img.currentSrc || img.src;
  if (!currentSrc) return false;

  const triedNormalizedFallback = img.dataset.normalizedFallbackApplied === "1";
  if (triedNormalizedFallback) return false;

  const normalizedUrl = toNormalizedProductFolderImageUrl(currentSrc);
  img.dataset.normalizedFallbackApplied = "1";
  if (normalizedUrl && normalizedUrl !== currentSrc) {
    img.src = normalizedUrl;
    return true;
  }

  return false;
}

function applyImagePlaceholder(img: HTMLImageElement) {
  if (img.dataset.placeholderApplied === "1") return;
  img.dataset.placeholderApplied = "1";
  img.src = "/pexels-foundertips-5218948.jpg";
}

function handleImageLoadError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (tryImageNormalizedFallback(img)) return;
  applyImagePlaceholder(img);
}

function buildAbsoluteImageByFilename(images: string[]): Map<string, string> {
  const byFilename = new Map<string, string>();
  for (const image of images) {
    if (!/^https?:\/\//i.test(image)) continue;
    const filename = getDecodedFilename(image);
    if (!filename || byFilename.has(filename)) continue;
    byFilename.set(filename, image);
  }
  return byFilename;
}

function resolveVariantImageUrl(
  imagePath: string,
  baseUrl: string | null,
  absoluteByFilename: Map<string, string>,
  canonicalFolderSegment?: string,
): string {
  if (!imagePath) return imagePath;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const isLocalPublicPath = imagePath.startsWith("/");

  const filename = getDecodedFilename(imagePath);
  if (filename && !isLocalPublicPath) {
    const knownAbsolute = absoluteByFilename.get(filename);
    if (knownAbsolute) return knownAbsolute;
  }

  return toPublicProductImageUrl(imagePath, baseUrl, canonicalFolderSegment);
}

function normalizeFilenameForDedup(filename: string): string {
  return filename.replace(/\s*\(\d+\)(?=\.[^.]+$)/, "");
}

function uniquePreferredImages(images: string[]): string[] {
  const byNormalizedName = new Map<string, string>();

  for (const image of images) {
    if (!image) continue;
    const filename = getDecodedFilename(image);
    if (!filename) continue;

    const normalized = normalizeFilenameForDedup(filename).toLowerCase();
    const existing = byNormalizedName.get(normalized);
    if (!existing) {
      byNormalizedName.set(normalized, image);
      continue;
    }

    const currentHasCounter = /\s*\(\d+\)(?=\.[^.]+$)/.test(filename);
    const existingHasCounter = /\s*\(\d+\)(?=\.[^.]+$)/.test(getDecodedFilename(existing));
    if (existingHasCounter && !currentHasCounter) {
      byNormalizedName.set(normalized, image);
    }
  }

  return Array.from(byNormalizedName.values());
}

function resolveManifestProductFolderKey(imagePath: string): string {
  const relativeParts = getProductImageRelativeSegments(imagePath);
  const folderFromPath = relativeParts[0] ?? "";
  if (!folderFromPath) return "";

  const folderKeyCandidates = new Set<string>([
    ...Object.keys(resolvedProductVariantManifest),
    ...Object.keys(resolvedProductFolderGalleryManifest),
  ]);

  if (folderKeyCandidates.has(folderFromPath)) return folderFromPath;

  const folderToken = toLookupToken(folderFromPath);
  for (const key of folderKeyCandidates) {
    if (toLookupToken(key) === folderToken) return key;
  }

  const filename = getDecodedFilename(imagePath);
  if (!filename) return folderFromPath;

  for (const [key, images] of Object.entries(resolvedProductFolderGalleryManifest)) {
    if (images.some((img) => getDecodedFilename(img) === filename)) return key;
  }

  for (const [key, variants] of Object.entries(resolvedProductVariantManifest)) {
    for (const images of Object.values(variants)) {
      if (images.some((img) => getDecodedFilename(img) === filename)) return key;
    }
  }

  return folderFromPath;
}

function getProductFolderName(imagePath: string): string {
  return resolveManifestProductFolderKey(imagePath);
}

function detectColorFromImagePath(imagePath: string): string | null {
  const parts = getProductImageRelativeSegments(imagePath);
  if (parts.length < 3) return null;
  return toDisplayColorName(parts[1]);
}

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const sizeGuide = product.sizeGuide;
  const fitBreakdown = getFitBreakdown(sizeGuide?.fit ?? "true-to-size");
  const recentlyViewedRaw = useRecentlyViewedProducts(8);
  const recentlyViewed = recentlyViewedRaw.filter((p) => p.id !== product.id).slice(0, 4);
  const { add, setOpen, detailed } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const [size, setSize] = useState(product.storage[0]);
  const productImagesBaseUrl = getProductImagesPublicBaseUrl(product.image);
  const canonicalFolderSegment = getProductImageRelativeSegments(product.image)[0];
  const productFolder = getProductFolderName(product.image);
  const folderGallery = useMemo(
    () =>
      (resolvedProductFolderGalleryManifest[productFolder] ?? []).map((imagePath) =>
        toPublicProductImageUrl(imagePath, productImagesBaseUrl, canonicalFolderSegment),
      ),
    [productFolder, productImagesBaseUrl, canonicalFolderSegment],
  );
  const folderVariants = resolvedProductVariantManifest[productFolder] ?? {};
  const knownAbsoluteImagesByFilename = useMemo(
    () =>
      buildAbsoluteImageByFilename([
        ...folderGallery,
        ...(product.gallery ?? []),
        product.image,
      ]),
    [folderGallery, product.gallery, product.image],
  );
  const variantEntries = useMemo(
    () => Object.entries(folderVariants).map(([rawColor, images]) => ({
      color: toDisplayColorName(rawColor),
      images: uniquePreferredImages(
        images.map((imagePath) =>
          resolveVariantImageUrl(
            imagePath,
            productImagesBaseUrl,
            knownAbsoluteImagesByFilename,
            canonicalFolderSegment,
          ),
        ),
      ),
    })),
    [folderVariants, productImagesBaseUrl, knownAbsoluteImagesByFilename, canonicalFolderSegment],
  );

  const fallbackColor = detectColorFromImagePath(product.image) ?? product.colors[0]?.name ?? "Default";
  const initialColor = variantEntries[0]?.color ?? fallbackColor;
  const [color, setColor] = useState(initialColor);

  const activeGallery = useMemo(() => {
    const selectedVariant = variantEntries.find((v) => v.color.toLowerCase() === color.toLowerCase());
    if (selectedVariant && selectedVariant.images.length > 0) return selectedVariant.images;
    if (folderGallery.length > 0) return folderGallery;
    if (product.gallery && product.gallery.length > 0) return product.gallery;
    return [product.image];
  }, [color, folderGallery, product.gallery, product.image, variantEntries]);

  const availableColors = useMemo(() => {
    if (variantEntries.length > 0) return variantEntries.map((v) => v.color);
    return [fallbackColor];
  }, [fallbackColor, variantEntries]);

  const [selectedImage, setSelectedImage] = useState(activeGallery[0]);
  const [added, setAdded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setColor(initialColor);
  }, [initialColor, product.id]);

  useEffect(() => {
    markProductRecentlyViewed(product.id);
  }, [product.id]);

  useEffect(() => {
    setSelectedImage((current) => {
      if (current && activeGallery.includes(current)) return current;
      return activeGallery[0];
    });
  }, [product.id, activeGallery]);

  const showPrevImage = () => {
    setSelectedImage((current) => {
      const currentIndex = activeGallery.indexOf(current);
      const safeIndex = currentIndex === -1 ? 0 : currentIndex;
      const prevIndex = (safeIndex - 1 + activeGallery.length) % activeGallery.length;
      return activeGallery[prevIndex];
    });
  };

  const showNextImage = () => {
    setSelectedImage((current) => {
      const currentIndex = activeGallery.indexOf(current);
      const safeIndex = currentIndex === -1 ? 0 : currentIndex;
      const nextIndex = (safeIndex + 1) % activeGallery.length;
      return activeGallery[nextIndex];
    });
  };

  const handleMainImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (tryImageNormalizedFallback(img)) return;

    const fallback = activeGallery.find((candidate) => candidate !== selectedImage);
    if (fallback && fallback !== selectedImage) {
      setSelectedImage(fallback);
      return;
    }

    applyImagePlaceholder(img);
  };

  const selectedIndex = Math.max(0, activeGallery.indexOf(selectedImage));

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const touchEndX = event.changedTouches[0]?.clientX;
    if (touchEndX === undefined) return;
    const deltaX = touchEndX - touchStartX.current;
    const swipeThreshold = 45;
    if (deltaX > swipeThreshold) showPrevImage();
    if (deltaX < -swipeThreshold) showNextImage();
    touchStartX.current = null;
  };

  const onAdd = () => {
    add({ productId: product.id, storage: size, color, qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    setOpen(true);
  };

  const related = products.filter((p) => p.id !== product.id && p.brand === product.brand).slice(0, 3);
  const alsoViewed = products.filter((p) => p.id !== product.id).slice(0, 10);
  const bundleProducts = products.filter((p) => p.id !== product.id).slice(0, 2);
  const primaryStyle = product.attributes?.styles?.[0];
  const primaryFabric = product.attributes?.fabrics?.[0];
  const styleMatches = products
    .filter((p) => p.id !== product.id)
    .filter((p) => {
      if (primaryStyle && (p.attributes?.styles ?? []).includes(primaryStyle)) return true;
      if (primaryFabric && (p.attributes?.fabrics ?? []).includes(primaryFabric)) return true;
      return false;
    })
    .slice(0, 4);
  const mixedRecommendations = useMemo(() => {
    const inBagIds = new Set(detailed.map((item) => item.productId));
    const bagBrands = new Set(detailed.map((item) => item.product.brand));

    return products
      .filter((candidate) => candidate.id !== product.id)
      .filter((candidate) => !inBagIds.has(candidate.id))
      .map((candidate) => {
        let score = 0;
        const reasons: string[] = [];
        const candidateStyles = candidate.attributes?.styles ?? [];
        const candidateFabrics = candidate.attributes?.fabrics ?? [];

        if (primaryStyle && candidateStyles.includes(primaryStyle)) {
          score += 24;
          reasons.push(`Because you viewed ${primaryStyle.toLowerCase()} styles`);
        }
        if (primaryFabric && candidateFabrics.includes(primaryFabric)) {
          score += 20;
          reasons.push(`Matches your ${primaryFabric.toLowerCase()} preference`);
        }
        if (bagBrands.has(candidate.brand)) {
          score += 18;
          reasons.push("Pairs with items in your bag");
        }
        if (recentlyViewed.some((recent) => recent.brand === candidate.brand)) {
          score += 8;
          reasons.push("From brands you viewed");
        }

        return {
          product: candidate,
          score,
          reason: reasons[0] ?? "Recommended for you",
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [detailed, product.id, primaryFabric, primaryStyle, recentlyViewed]);
  const [liveReviews, setLiveReviews] = useState<CustomerReview[]>([]);
  const [loadingLiveReviews, setLoadingLiveReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewRatingInput, setReviewRatingInput] = useState(5);
  const [reviewFitInput, setReviewFitInput] = useState<ProductReviewFit>("True to size");
  const [reviewSizeInput, setReviewSizeInput] = useState(product.storage[0] ?? "M");
  const [reviewTextInput, setReviewTextInput] = useState("");
  const [reviewPhotosInput, setReviewPhotosInput] = useState("");

  const demoReviews = useMemo(() => buildReviews(activeGallery), [activeGallery]);
  const reviews = useMemo(() => [...liveReviews, ...demoReviews], [liveReviews, demoReviews]);
  const [reviewSort, setReviewSort] = useState<ReviewSort>("helpful");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

  useEffect(() => {
    let disposed = false;
    setLoadingLiveReviews(true);
    void fetchProductReviews(product.id)
      .then((rows) => {
        if (disposed) return;
        const mapped: CustomerReview[] = rows.map((row) => ({
          id: row.id,
          name: row.reviewerName,
          rating: row.rating,
          date: formatReviewDate(row.createdAt),
          fit: row.fit,
          size: row.sizeLabel,
          text: row.reviewText,
          photos: row.photos,
          verified: row.verifiedPurchase,
          helpful: row.helpfulCount,
        }));
        setLiveReviews(mapped);
      })
      .catch(() => {
        if (!disposed) setLiveReviews([]);
      })
      .finally(() => {
        if (!disposed) setLoadingLiveReviews(false);
      });

    return () => {
      disposed = true;
    };
  }, [product.id]);

  const displayedReviews = useMemo(() => {
    let list = [...reviews];

    if (reviewFilter === "with-photos") {
      list = list.filter((review) => review.photos.length > 0);
    }
    if (reviewFilter === "5-star") {
      list = list.filter((review) => review.rating === 5);
    }
    if (reviewFilter === "4-star") {
      list = list.filter((review) => review.rating === 4);
    }
    if (reviewFilter === "true-to-size") {
      list = list.filter((review) => review.fit === "True to size");
    }

    if (reviewSort === "helpful") {
      list.sort((a, b) => b.helpful - a.helpful);
    }
    if (reviewSort === "newest") {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    if (reviewSort === "highest") {
      list.sort((a, b) => b.rating - a.rating);
    }
    if (reviewSort === "lowest") {
      list.sort((a, b) => a.rating - b.rating);
    }

    return list;
  }, [reviews, reviewFilter, reviewSort]);
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const sku = `JC-${product.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const oldPrice = Math.max(product.price + 18, Math.round(product.price * 1.8));
  const discountPct = Math.max(1, Math.round(((oldPrice - product.price) / oldPrice) * 100));
  const stock = getStockHint(product.id);
  const liveShoppers = getLiveShoppersHint(product.id);
  const bundleTotal = product.price + bundleProducts.reduce((sum, item) => sum + item.price, 0);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const reviewCountLabel = reviews.length >= 1000 ? "1000+" : String(reviews.length);
  const initialDealSeconds = useMemo(() => {
    let hash = 0;
    for (const char of product.id) hash = (hash * 39 + char.charCodeAt(0)) & 0xffffffff;
    return 4 * 3600 + (Math.abs(hash) % 7200); // 4h to 6h window
  }, [product.id]);
  const [dealSecondsLeft, setDealSecondsLeft] = useState(initialDealSeconds);

  useEffect(() => {
    setDealSecondsLeft(initialDealSeconds);
  }, [initialDealSeconds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDealSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    for (const product of alsoViewed) {
      trackRecommendationImpression("pdp-customers-also-viewed", product.id);
    }
  }, [alsoViewed]);

  useEffect(() => {
    for (const product of styleMatches) {
      trackRecommendationImpression("pdp-style-matches", product.id);
    }
  }, [styleMatches]);

  useEffect(() => {
    for (const entry of mixedRecommendations) {
      trackRecommendationImpression("pdp-mixed-next", entry.product.id);
    }
  }, [mixedRecommendations]);

  useEffect(() => {
    for (const product of related) {
      trackRecommendationImpression("pdp-brand-more", product.id);
    }
  }, [related]);

  useEffect(() => {
    for (const product of recentlyViewed) {
      trackRecommendationImpression("pdp-recently-viewed", product.id);
    }
  }, [recentlyViewed]);

  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Photo lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          <button
            type="button"
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <ChevronLeft className="h-5 w-5 rotate-135" />
          </button>
          <img
            src={lightboxPhoto}
            alt="Customer review photo"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={handleImageLoadError}
          />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-5 pt-8">
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> All pieces
        </Link>
      </div>
      <section id="details" className="scroll-mt-28 mx-auto max-w-7xl px-5 pt-4 pb-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ffc9d2] bg-[#fff0f2] px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-[#c9123a]">
            <Clock3 className="h-4 w-4" />
            <span className="font-semibold">Flash deal ends in {formatCountdown(dealSecondsLeft)}</span>
          </div>
          <div className="text-[#7a3a27]">Free returns in 30 days</div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => scrollToSection("details")}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-foreground/40"
          >
            Product Details
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("reviews")}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-foreground/40"
          >
            Reviews
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("recommendations")}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-foreground/40"
          >
            You May Also Like
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[68px_minmax(0,1fr)_390px]">
          <aside className="hidden lg:flex lg:flex-col lg:gap-2.5">
            {activeGallery.map((img, idx) => (
              <button
                key={img}
                onClick={() => setSelectedImage(img)}
                aria-label={`View image ${idx + 1}`}
                className={`overflow-hidden rounded-md border ${selectedImage === img ? "border-foreground" : "border-border"}`}
              >
                <img src={img} alt={product.name} className="h-16 w-full object-cover" loading="lazy" onError={handleImageLoadError} />
              </button>
            ))}
          </aside>

          <div
            className="group relative self-start overflow-hidden rounded-xl border border-border lg:max-h-[76vh]"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={selectedImage}
              alt={product.name}
              className="block h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              onError={handleMainImageError}
            />
            <button
              onClick={showPrevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-border bg-background/90 text-foreground hover:bg-background"
              aria-label="Previous image"
            >
              <ChevronLeft className="mx-auto h-4 w-4" />
            </button>
            <button
              onClick={showNextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-border bg-background/90 text-foreground hover:bg-background"
              aria-label="Next image"
            >
              <ChevronRight className="mx-auto h-4 w-4" />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {selectedIndex + 1} / {activeGallery.length}
            </div>
          </div>

          <div className="lg:sticky lg:top-24 self-start">
            <h1 className="text-2xl font-medium leading-tight">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>SKU: {sku}</span>
              <div className="flex items-center gap-1 text-[#f4b400]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-[#f4b400]">(1000+ reviews)</span>
            </div>

            <div className="mt-4 flex items-end gap-2.5">
              <span className="text-3xl font-semibold text-[#fe2c55]">{formatPrice(product.price, product.id)}</span>
              <span className="rounded bg-[#fff0f2] px-2 py-0.5 text-sm font-medium text-[#fe2c55]">Estimated -{discountPct}%</span>
              <span className="text-base text-muted-foreground line-through">{formatOldPrice(oldPrice, product.id)}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-sm text-[#fe2c55]"><Clock3 className="h-4 w-4" /> Last day</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {["53% OFF: No Min. Buy", "51% OFF orders $31.64+", "35% OFF select items"].map((offer) => (
                <span key={offer} className="rounded border border-[#ffc9d2] bg-[#fff0f2] px-2 py-1 text-[#fe2c55]">{offer}</span>
              ))}
            </div>
            <div className="mt-3 rounded border border-[#b9dcca] bg-[#e8f5ec] px-3 py-2 text-[#1f7d57]">Special Free Shipping Deal</div>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#ffc9d2] bg-[#fff0f2] px-3 py-2 text-xs text-[#c9123a]">
              <span className="rounded-full bg-[#111] px-2 py-0.5 font-semibold text-white">Coupon</span>
              <span>Use code WET15 for extra savings on this item.</span>
            </div>

            <div className="mt-5">
              <div className="text-xl font-semibold">Color: <span className="font-normal text-muted-foreground">{color}</span></div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {availableColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={c}
                    className="group flex w-14 flex-col items-center gap-1"
                  >
                    <span
                      className={`h-11 w-11 rounded-md border-2 ${colorClassMap[c] ?? "bg-muted"} ${color === c ? "border-foreground" : "border-border"}`}
                    />
                    <span className={`text-xs ${color === c ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                      {c}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2.5 text-2xl font-semibold">Size</div>
              <div className="flex flex-wrap gap-2.5">
                {product.storage.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-14 rounded-full border px-5 py-1.5 text-lg transition ${size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">Sizing guidance</div>
                <p className="mt-1">
                  {sizeGuide?.guidance ?? "Most shoppers choose their usual size for this style."}
                </p>
              </div>

              {sizeGuide?.chart && sizeGuide.chart.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background">
                  <div className="grid grid-cols-3 border-b border-border bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Size</span>
                    <span>Bust</span>
                    <span>Hips</span>
                  </div>
                  {sizeGuide.chart.map((row) => (
                    <div key={row.size} className="grid grid-cols-3 border-b border-border/70 px-3 py-2 text-xs last:border-b-0">
                      <span className="font-medium text-foreground">{row.size}</span>
                      <span className="text-muted-foreground">{row.bust}</span>
                      <span className="text-muted-foreground">{row.hips}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scarcity signal */}
            <div className={`mt-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              stock.urgent
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}>
              <span className={`h-2 w-2 rounded-full ${stock.urgent ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
              {stock.label}
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#efe6c3] bg-[#fffbe8] px-3 py-2 text-sm text-[#7c6a18]">
              <span className="h-2 w-2 rounded-full bg-[#e0b400]" />
              {liveShoppers} shoppers are viewing this right now
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={onAdd}
                className="flex-1 rounded-none bg-black py-4 text-lg font-semibold text-white hover:opacity-90"
              >
                {added ? "ADDED" : "ADD TO CART"}
              </button>
              <button
                aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                onClick={() => toggleWishlist(product.id)}
                className="h-14 w-14 rounded-full border border-border text-foreground hover:bg-background transition-colors"
              >
                <Heart className={`mx-auto h-8 w-8 transition-colors ${isWishlisted(product.id) ? "fill-red-500 text-red-500" : ""}`} />
              </button>
            </div>
            <Link
              to="/checkout"
              onClick={() => add({ productId: product.id, storage: size, color, qty: 1 })}
              className="mt-3 inline-flex w-full items-center justify-center rounded-none border border-black bg-white py-3 text-sm font-semibold text-black hover:bg-black hover:text-white"
            >
              BUY NOW
            </Link>

            <div className="mt-6 space-y-3">
              <div className="flex gap-3 rounded-xl bg-surface p-4">
                <Truck className="h-5 w-5 shrink-0 text-foreground mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold">Free shipping & returns</div>
                  <div className="text-muted-foreground">30-day exchanges on all orders</div>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-[#ffc9d2] bg-[#fff0f2] p-4">
                <Clock3 className="h-5 w-5 shrink-0 text-[#fe2c55] mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-[#c9123a]">Delivers in 2&ndash;10 days</div>
                  <div className="text-[#a40d2f]">Across Harare and major cities</div>
                </div>
              </div>
            </div>

            <ul className="mt-6 grid gap-2 text-sm">
              {product.highlights.slice(0, 4).map((h) => (
                <li key={h} className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 text-brand" /> {h}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-border bg-background p-4">
              <h3 className="text-lg font-semibold">Product info</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              <div className="mt-3 text-sm text-muted-foreground">Selected color: <span className="font-medium text-foreground">{color}</span></div>
              <div className="mt-1 text-sm text-muted-foreground">Available colors: {availableColors.join(", ")}</div>
            </div>

            <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1"><Truck className="h-4 w-4" /> Fast local delivery</div>
              <div className="inline-flex items-center gap-1"><Heart className="h-4 w-4" /> Loved by Harare shoppers</div>
            </div>
          </div>

          <section className="hidden rounded-xl border border-border bg-surface p-5 lg:col-span-2 lg:block">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight">Customer Reviews ({reviewCountLabel})</h2>
              <button
                type="button"
                onClick={() => scrollToSection("reviews")}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                View all reviews
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {displayedReviews.slice(0, 3).map((review) => (
                <article key={`preview-${review.id}`} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{review.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{review.date}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[#f4b400]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={`${review.id}-preview-star-${index}`}
                          className={`h-3.5 w-3.5 ${index < review.rating ? "fill-current" : "fill-neutral-200 text-neutral-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{review.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 lg:hidden">
          {activeGallery.map((img, idx) => (
            <button
              key={img}
              onClick={() => setSelectedImage(img)}
              aria-label={`View image ${idx + 1}`}
              className={`overflow-hidden rounded-md border ${selectedImage === img ? "border-foreground" : "border-border"}`}
            >
              <img src={img} alt={product.name} className="h-20 w-full object-cover" loading="lazy" onError={handleImageLoadError} />
            </button>
          ))}
        </div>
      </section>

      <section id="reviews" className="scroll-mt-28 mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold tracking-tight">Customer Reviews ({reviewCountLabel})</h2>
            <button className="text-sm text-muted-foreground hover:text-foreground">View all</button>
          </div>

          <form
            className="mt-5 rounded-xl border border-border bg-background p-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (submittingReview) return;

              const name = reviewName.trim();
              const text = reviewTextInput.trim();
              const sizeValue = reviewSizeInput.trim();
              if (!name || !text || !sizeValue) {
                setReviewSubmitError("Please fill in your name, size, and review text.");
                setReviewSubmitSuccess("");
                return;
              }

              const photos = reviewPhotosInput
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean);

              setSubmittingReview(true);
              setReviewSubmitError("");
              setReviewSubmitSuccess("");

              void createProductReview({
                productId: product.id,
                reviewerName: name,
                rating: reviewRatingInput,
                fit: reviewFitInput,
                sizeLabel: sizeValue,
                reviewText: text,
                photos,
              })
                .then((created) => {
                  const review: CustomerReview = {
                    id: created.id,
                    name: created.reviewerName,
                    rating: created.rating,
                    date: formatReviewDate(created.createdAt),
                    fit: created.fit,
                    size: created.sizeLabel,
                    text: created.reviewText,
                    photos: created.photos,
                    verified: created.verifiedPurchase,
                    helpful: created.helpfulCount,
                  };
                  setLiveReviews((current) => [review, ...current]);
                  setReviewName("");
                  setReviewTextInput("");
                  setReviewPhotosInput("");
                  setReviewSubmitSuccess("Review posted. Thank you for sharing your experience.");
                })
                .catch(() => {
                  setReviewSubmitError("Could not post your review right now. Please try again.");
                })
                .finally(() => {
                  setSubmittingReview(false);
                });
            }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Write a review</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                value={reviewName}
                onChange={(event) => setReviewName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                aria-label="Reviewer name"
              />
              <input
                value={reviewSizeInput}
                onChange={(event) => setReviewSizeInput(event.target.value)}
                placeholder="Size purchased"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                aria-label="Purchased size"
              />
              <select
                value={reviewRatingInput}
                onChange={(event) => setReviewRatingInput(Number(event.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                aria-label="Review rating"
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Okay</option>
                <option value={2}>2 - Poor</option>
                <option value={1}>1 - Bad</option>
              </select>
              <select
                value={reviewFitInput}
                onChange={(event) => setReviewFitInput(event.target.value as ProductReviewFit)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                aria-label="Review fit"
              >
                <option value="True to size">True to size</option>
                <option value="Small">Small</option>
                <option value="Large">Large</option>
              </select>
            </div>
            <textarea
              value={reviewTextInput}
              onChange={(event) => setReviewTextInput(event.target.value)}
              placeholder="Tell other shoppers how it fits, feels, and looks..."
              className="mt-3 min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              aria-label="Review text"
            />
            <input
              value={reviewPhotosInput}
              onChange={(event) => setReviewPhotosInput(event.target.value)}
              placeholder="Optional photo URLs (comma separated)"
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              aria-label="Review photo URLs"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="submit"
                disabled={submittingReview}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
              >
                {submittingReview ? "Posting..." : "Post review"}
              </button>
              {loadingLiveReviews && <span className="text-xs text-muted-foreground">Refreshing reviews...</span>}
            </div>
            {reviewSubmitError && <p className="mt-2 text-xs text-[#b42318]">{reviewSubmitError}</p>}
            {reviewSubmitSuccess && <p className="mt-2 text-xs text-[#1f7d57]">{reviewSubmitSuccess}</p>}
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-5xl font-semibold leading-none">{averageRating.toFixed(2)}</span>
            <div className="flex items-center gap-1 text-[#f4b400]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Review policy</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {([
              { id: "all", label: "All" },
              { id: "with-photos", label: "With photos" },
              { id: "5-star", label: "5 star" },
              { id: "4-star", label: "4 star" },
              { id: "true-to-size", label: "True to size" },
            ] as { id: ReviewFilter; label: string }[]).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setReviewFilter(item.id)}
                className={`rounded-full border px-3 py-1 text-xs ${reviewFilter === item.id ? "border-foreground bg-foreground text-background" : "border-border"}`}
              >
                {item.label}
              </button>
            ))}

            <select
              value={reviewSort}
              onChange={(event) => setReviewSort(event.target.value as ReviewSort)}
              className="ml-auto rounded-full border border-border bg-background px-3 py-1.5 text-xs"
              aria-label="Sort reviews"
              title="Sort reviews"
            >
              <option value="helpful">Most helpful</option>
              <option value="newest">Newest</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>

          <div className="mt-4 grid gap-6 border-t border-border pt-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <div className="text-sm font-medium">Overall Fit</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="grid grid-cols-[70px_1fr_40px] items-center gap-2">
                  <span>Small</span>
                  <div className="h-1.5 rounded bg-border"><div className={`h-1.5 rounded bg-foreground ${getFitWidthClass(fitBreakdown.small)}`} /></div>
                  <span>{fitBreakdown.small}%</span>
                </div>
                <div className="grid grid-cols-[70px_1fr_40px] items-center gap-2">
                  <span>True to size</span>
                  <div className="h-1.5 rounded bg-border"><div className={`h-1.5 rounded bg-foreground ${getFitWidthClass(fitBreakdown.trueToSize)}`} /></div>
                  <span>{fitBreakdown.trueToSize}%</span>
                </div>
                <div className="grid grid-cols-[70px_1fr_40px] items-center gap-2">
                  <span>Large</span>
                  <div className="h-1.5 rounded bg-border"><div className={`h-1.5 rounded bg-foreground ${getFitWidthClass(fitBreakdown.large)}`} /></div>
                  <span>{fitBreakdown.large}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {displayedReviews.map((review) => (
                <article key={review.id} className="border border-border rounded-xl p-5 bg-background">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{review.name}</span>
                          {review.verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#ecf8f1] px-2 py-0.5 text-[10px] font-medium text-[#1f7d57]">
                              <Check className="h-3 w-3" /> Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <div className="flex items-center gap-0.5 text-[#f4b400]">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-current" : "text-border"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">· {review.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Fit: {review.fit} · Size: {review.size}</div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground">{review.text}</p>
                  {review.photos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.photos.map((photo) => (
                        <button key={photo} type="button" onClick={() => setLightboxPhoto(photo)} className="focus:outline-none">
                          <img src={photo} alt="Customer photo" className="h-20 w-20 rounded-lg object-cover border border-border hover:opacity-90 transition cursor-zoom-in" loading="lazy" onError={handleImageLoadError} />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Helpful?</span>
                    <button type="button" className="rounded border border-border px-2 py-0.5 hover:border-foreground/40 transition">Yes ({review.helpful})</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div id="recommendations" className="scroll-mt-28" />

      {bundleProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-12">
          <div className="rounded-xl border border-border bg-background p-5 md:p-6">
            <h2 className="text-2xl font-semibold tracking-tight">Frequently Bought Together</h2>
            <p className="mt-1 text-sm text-muted-foreground">Complete the look with this high-converting pairing set.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[product, ...bundleProducts].map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  <div className="aspect-3/4 overflow-hidden rounded-md bg-muted">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" onError={handleImageLoadError} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{shortenName(item.name)}</p>
                  <p className="mt-1 text-sm font-semibold text-[#fe2c55]">{formatPrice(item.price, item.id)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Bundle Total</p>
                <p className="text-2xl font-semibold text-[#fe2c55]">{formatPrice(bundleTotal, product.id)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  add({ productId: product.id, storage: size, color, qty: 1 });
                  for (const item of bundleProducts) {
                    add({
                      productId: item.id,
                      storage: item.storage[0] ?? "One Size",
                      color: item.colors[0]?.name ?? "Default",
                      qty: 1,
                    });
                  }
                  setOpen(true);
                }}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
              >
                Add bundle to bag
              </button>
            </div>
          </div>
        </section>
      )}

      {alsoViewed.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-16">
          <h2 className="text-4xl font-semibold tracking-tight mb-6">Customers Also Viewed</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {alsoViewed.map((p) => (
              <Link
                key={p.id}
                to="/product/$id"
                params={{ id: p.id }}
                onClick={() => trackRecommendationClick("pdp-customers-also-viewed", p.id)}
                className="group rounded-lg border border-border overflow-hidden bg-background hover:shadow-md transition"
              >
                <div className="aspect-3/4 overflow-hidden">
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={handleImageLoadError} />
                </div>
                <div className="p-3">
                  <div className="text-xs text-[#fe2c55]">-{Math.max(8, Math.min(60, Math.round(((p.price + 20 - p.price) / (p.price + 20)) * 100)))}% Last day</div>
                  <div className="mt-1 text-sm leading-tight">{shortenName(p.name)}</div>
                  <div className="mt-1 text-xl font-semibold text-[#fe2c55]">{formatPrice(p.price, p.id)}</div>
                  <div className="text-xs text-muted-foreground">Estimated</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {styleMatches.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
            Similar {primaryStyle ? `${primaryStyle} Styles` : "Styles You May Like"}
          </h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {styleMatches.map((p) => (
              <ProductCard
                key={`style-${p.id}`}
                p={p}
                clean
                recommendationReason="Similar style"
                onClick={() => trackRecommendationClick("pdp-style-matches", p.id)}
              />
            ))}
          </div>
        </section>
      )}

      {mixedRecommendations.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Recommended Next</h2>
          <p className="mb-6 text-sm text-muted-foreground">A mixed feed of style matches and bag complements.</p>
          {import.meta.env.DEV && (
            <details className="mb-4 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Recommendation debug</summary>
              <div className="mt-2 space-y-1">
                {mixedRecommendations.map((entry) => (
                  <div key={`debug-${entry.product.id}`} className="flex items-center justify-between gap-3">
                    <span className="line-clamp-1">{entry.product.name}</span>
                    <span className="shrink-0">score {entry.score} · {entry.reason}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {mixedRecommendations.map((entry) => (
              <ProductCard
                key={`mixed-${entry.product.id}`}
                p={entry.product}
                clean
                recommendationReason={entry.reason}
                onClick={() => trackRecommendationClick("pdp-mixed-next", entry.product.id)}
              />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">More from {product.brand}</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                clean
                recommendationReason="More from this brand"
                onClick={() => trackRecommendationClick("pdp-brand-more", p.id)}
              />
            ))}
          </div>
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Your Recently Viewed</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {recentlyViewed.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                clean
                recommendationReason="Viewed recently"
                onClick={() => trackRecommendationClick("pdp-recently-viewed", p.id)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-14 z-60 border-t border-border bg-background/95 px-3 py-2.5 backdrop-blur md:bottom-0 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-5">
          <button
            type="button"
            aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
            onClick={() => toggleWishlist(product.id)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border"
          >
            <Heart className={`h-5 w-5 transition-colors ${isWishlisted(product.id) ? "fill-[#fe2c55] text-[#fe2c55]" : ""}`} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] text-muted-foreground">{shortenName(product.name)}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-[#fe2c55]">{formatPrice(product.price, product.id)}</span>
              <span className="text-[11px] text-muted-foreground line-through">{formatOldPrice(oldPrice, product.id)}</span>
            </div>
          </div>
          <button
            onClick={onAdd}
            className="flex-1 rounded-full bg-[#fe2c55] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#c9123a]"
          >
            {added ? "✓ Added" : "Add to Bag"}
          </button>
        </div>
      </div>
      <div className="h-32 lg:hidden" />
    </>
  );
}
