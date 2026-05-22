import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { fetchProductById, getProduct, products, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { formatPrice, formatOldPrice } from "@/lib/format-price";
import { productFolderGalleryManifest } from "@/lib/product-folder-galleries";
import { productVariantManifest } from "@/lib/product-variants";
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, Heart, Star, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useWishlist } from "@/lib/wishlist";

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

function shortenName(name: string): string {
  return name.length > 32 ? `${name.slice(0, 29)}...` : name;
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
    const marker = "/storage/v1/object/public/product-images/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return `${url.origin}/storage/v1/object/public/product-images`;
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

function toPublicProductImageUrl(
  imagePath: string,
  baseUrl: string | null,
  canonicalFolderSegment?: string,
): string {
  if (!imagePath) return imagePath;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
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
  return `${baseUrl}/${encodedPath}`;
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
  img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
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

  const filename = getDecodedFilename(imagePath);
  if (filename) {
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
    ...Object.keys(productFolderGalleryManifest),
    ...Object.keys(productVariantManifest),
  ]);

  if (folderKeyCandidates.has(folderFromPath)) return folderFromPath;

  const folderToken = toLookupToken(folderFromPath);
  for (const key of folderKeyCandidates) {
    if (toLookupToken(key) === folderToken) return key;
  }

  const filename = getDecodedFilename(imagePath);
  if (!filename) return folderFromPath;

  for (const [key, images] of Object.entries(productFolderGalleryManifest)) {
    if (images.some((img) => getDecodedFilename(img) === filename)) return key;
  }

  for (const [key, variants] of Object.entries(productVariantManifest)) {
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
  const { add, setOpen } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const [size, setSize] = useState(product.storage[0]);
  const productImagesBaseUrl = getProductImagesPublicBaseUrl(product.image);
  const canonicalFolderSegment = getProductImageRelativeSegments(product.image)[0];
  const productFolder = getProductFolderName(product.image);
  const folderGallery = useMemo(
    () =>
      (productFolderGalleryManifest[productFolder] ?? []).map((imagePath) =>
        toPublicProductImageUrl(imagePath, productImagesBaseUrl, canonicalFolderSegment),
      ),
    [productFolder, productImagesBaseUrl, canonicalFolderSegment],
  );
  const folderVariants = productVariantManifest[productFolder] ?? {};
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
  const reviews = buildReviews(activeGallery);
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const sku = `JC-${product.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const oldPrice = Math.max(product.price + 18, Math.round(product.price * 1.8));
  const discountPct = Math.max(1, Math.round(((oldPrice - product.price) / oldPrice) * 100));
  const stock = getStockHint(product.id);
  const bundleTotal = product.price + bundleProducts.reduce((sum, item) => sum + item.price, 0);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

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

      <div className="mx-auto max-w-350 px-6 pt-8">
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> All pieces
        </Link>
      </div>
      <section className="mx-auto max-w-350 px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[88px_minmax(0,1fr)_460px]">
          <aside className="hidden lg:flex lg:flex-col lg:gap-3">
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
          </aside>

          <div
            className="group relative self-start overflow-hidden rounded-xl border border-border"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={selectedImage}
              alt={product.name}
              className="block h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={handleMainImageError}
            />
            <button
              onClick={showPrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full border border-border bg-background/90 text-foreground hover:bg-background"
              aria-label="Previous image"
            >
              <ChevronLeft className="mx-auto h-5 w-5" />
            </button>
            <button
              onClick={showNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full border border-border bg-background/90 text-foreground hover:bg-background"
              aria-label="Next image"
            >
              <ChevronRight className="mx-auto h-5 w-5" />
            </button>
            <div className="absolute bottom-4 right-4 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground">
              {selectedIndex + 1} / {activeGallery.length}
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-medium leading-tight">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>SKU: {sku}</span>
              <div className="flex items-center gap-1 text-[#f4b400]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-[#f4b400]">(1000+ reviews)</span>
            </div>

            <div className="mt-5 flex items-end gap-3">
              <span className="text-4xl font-semibold text-[#e14f2a]">{formatPrice(product.price, product.id)}</span>
              <span className="rounded bg-[#ffe9dc] px-2 py-0.5 text-sm font-medium text-[#e14f2a]">Estimated -{discountPct}%</span>
              <span className="text-lg text-muted-foreground line-through">{formatOldPrice(oldPrice, product.id)}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-sm text-[#e14f2a]"><Clock3 className="h-4 w-4" /> Last day</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {["53% OFF: No Min. Buy", "51% OFF orders $31.64+", "35% OFF select items"].map((offer) => (
                <span key={offer} className="rounded border border-[#ffb79f] bg-[#fff2ec] px-2 py-1 text-[#e14f2a]">{offer}</span>
              ))}
            </div>
            <div className="mt-3 rounded border border-[#b9dcca] bg-[#e8f5ec] px-3 py-2 text-[#1f7d57]">Special Free Shipping Deal</div>

            <div className="mt-6">
              <div className="text-2xl font-semibold">Color: <span className="font-normal text-muted-foreground">{color}</span></div>
              <div className="mt-3 flex flex-wrap gap-3">
                {availableColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={c}
                    className="group flex w-16 flex-col items-center gap-1"
                  >
                    <span
                      className={`h-12 w-12 rounded-md border-2 ${colorClassMap[c] ?? "bg-muted"} ${color === c ? "border-foreground" : "border-border"}`}
                    />
                    <span className={`text-xs ${color === c ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                      {c}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 text-3xl font-semibold">Size</div>
              <div className="flex flex-wrap gap-3">
                {product.storage.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-16 rounded-full border px-6 py-2 text-xl transition ${size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
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
              className="mt-3 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Buy now
            </Link>

            <div className="mt-6 space-y-3">
              <div className="flex gap-3 rounded-xl bg-surface p-4">
                <Truck className="h-5 w-5 shrink-0 text-foreground mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold">Free shipping & returns</div>
                  <div className="text-muted-foreground">30-day exchanges on all orders</div>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-border bg-background p-4">
                <Clock3 className="h-5 w-5 shrink-0 text-foreground mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold">Ships in 1-2 days</div>
                  <div className="text-muted-foreground">Delivery within 3-5 business days</div>
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

      <section className="mx-auto max-w-350 px-6 py-12">
        <div className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold tracking-tight">Customer Reviews (1000+)</h2>
            <button className="text-sm text-muted-foreground hover:text-foreground">View all</button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-5xl font-semibold leading-none">{averageRating.toFixed(2)}</span>
            <div className="flex items-center gap-1 text-[#f4b400]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Review policy</span>
          </div>

          <div className="mt-4 grid gap-6 border-t border-border pt-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <div className="text-sm font-medium">Overall Fit</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="grid grid-cols-[70px_1fr_40px] items-center gap-2">
                  <span>Small</span>
                  <div className="h-1.5 rounded bg-border"><div className="h-1.5 w-[7%] rounded bg-foreground" /></div>
                  <span>7%</span>
                </div>
                <div className="grid grid-cols-[70px_1fr_40px] items-center gap-2">
                  <span>True to size</span>
                  <div className="h-1.5 rounded bg-border"><div className="h-1.5 w-[90%] rounded bg-foreground" /></div>
                  <span>90%</span>
                </div>
                <div className="grid grid-cols-[70px_1fr_40px] items-center gap-2">
                  <span>Large</span>
                  <div className="h-1.5 rounded bg-border"><div className="h-1.5 w-[3%] rounded bg-foreground" /></div>
                  <span>3%</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {reviews.map((review) => (
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

      {bundleProducts.length > 0 && (
        <section className="mx-auto max-w-350 px-6 pb-12">
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
                  <p className="mt-1 text-sm font-semibold text-[#e14f2a]">{formatPrice(item.price, item.id)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Bundle Total</p>
                <p className="text-2xl font-semibold text-[#e14f2a]">{formatPrice(bundleTotal, product.id)}</p>
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
        <section className="mx-auto max-w-350 px-6 pb-16">
          <h2 className="text-4xl font-semibold tracking-tight mb-6">Customers Also Viewed</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {alsoViewed.map((p) => (
              <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="group rounded-lg border border-border overflow-hidden bg-background hover:shadow-md transition">
                <div className="aspect-3/4 overflow-hidden">
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={handleImageLoadError} />
                </div>
                <div className="p-3">
                  <div className="text-xs text-[#e14f2a]">-{Math.max(8, Math.min(60, Math.round(((p.price + 20 - p.price) / (p.price + 20)) * 100)))}% Last day</div>
                  <div className="mt-1 text-sm leading-tight">{shortenName(p.name)}</div>
                  <div className="mt-1 text-xl font-semibold text-[#e14f2a]">{formatPrice(p.price, p.id)}</div>
                  <div className="text-xs text-muted-foreground">Estimated</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mx-auto max-w-350 px-6 py-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">More from {product.brand}</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} p={p} clean />)}
          </div>
        </section>
      )}
    </>
  );
}
