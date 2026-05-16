import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { getProduct, products, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { formatPrice, formatOldPrice } from "@/lib/format-price";
import { productFolderGalleryManifest } from "@/lib/product-folder-galleries";
import { productVariantManifest } from "@/lib/product-variants";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, Heart, Star, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";

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
  loader: ({ params }) => {
    const product = getProduct(params.id);
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
};

function buildReviews(gallery: string[]): CustomerReview[] {
  const safeGallery = gallery.length > 0 ? gallery : ["/pexels-foundertips-5218948.jpg"];
  return [
    {
      id: "r1",
      name: "Anonymous",
      rating: 5,
      date: "14 May 2024",
      fit: "True to size",
      size: "L",
      text: "Good quality and looks beautiful. The fit was exactly what I expected and the fabric feels great.",
      photos: safeGallery.slice(0, 3),
    },
    {
      id: "r2",
      name: "Anonymous",
      rating: 5,
      date: "14 Sep 2024",
      fit: "True to size",
      size: "S",
      text: "Perfect fit and very comfortable. I love the look and the stitching is clean.",
      photos: safeGallery.slice(1, 3),
    },
    {
      id: "r3",
      name: "Anonymous",
      rating: 4,
      date: "03 Jan 2025",
      fit: "Small",
      size: "M",
      text: "Really nice product. I would size up if you want a relaxed fit.",
      photos: safeGallery.slice(2, 4),
    },
  ];
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

function getProductFolderName(imagePath: string): string {
  const parts = imagePath.split("/").filter(Boolean);
  return parts[0] ?? "";
}

function detectColorFromImagePath(imagePath: string): string | null {
  const parts = imagePath.split("/").filter(Boolean);
  if (parts.length < 3) return null;
  return toDisplayColorName(parts[1]);
}

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const { add, setOpen } = useCart();
  const [size, setSize] = useState(product.storage[0]);
  const productFolder = getProductFolderName(product.image);
  const folderGallery = productFolderGalleryManifest[productFolder] ?? [];
  const folderVariants = productVariantManifest[productFolder] ?? {};
  const variantEntries = useMemo(
    () => Object.entries(folderVariants).map(([rawColor, images]) => ({
      color: toDisplayColorName(rawColor),
      images,
    })),
    [folderVariants],
  );

  const fallbackColor = detectColorFromImagePath(product.image) ?? product.colors[0]?.name ?? "Default";
  const initialColor = variantEntries[0]?.color ?? fallbackColor;
  const [color, setColor] = useState(initialColor);

  const activeGallery = useMemo(() => {
    const selectedVariant = variantEntries.find((v) => v.color.toLowerCase() === color.toLowerCase());
    if (selectedVariant && selectedVariant.images.length > 0) return selectedVariant.images;
    if (product.gallery && product.gallery.length > 0) return product.gallery;
    if (folderGallery.length > 0) return folderGallery;
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
    setSelectedImage(activeGallery[0]);
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
  const reviews = buildReviews(activeGallery);
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const sku = `JC-${product.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const oldPrice = Math.max(product.price + 18, Math.round(product.price * 1.8));
  const discountPct = Math.max(1, Math.round(((oldPrice - product.price) / oldPrice) * 100));

  return (
    <>
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
                <img src={img} alt={product.name} className="h-20 w-full object-cover" loading="lazy" />
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

            <div className="mt-7 flex gap-3">
              <button
                onClick={onAdd}
                className="flex-1 rounded-none bg-black py-4 text-lg font-semibold text-white hover:opacity-90"
              >
                {added ? "ADDED" : "ADD TO CART"}
              </button>
              <button
                aria-label="Add to wishlist"
                className="h-14 w-14 rounded-full border border-border text-foreground hover:bg-background"
              >
                <Heart className="mx-auto h-8 w-8" />
              </button>
            </div>

            <Link
              to="/checkout"
              onClick={() => add({ productId: product.id, storage: size, color, qty: 1 })}
              className="mt-3 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Buy now
            </Link>

            <div className="mt-6 rounded-xl bg-surface p-4">
              <div className="text-xl"><span className="font-semibold">Shipping</span> to Harare</div>
              <p className="mt-2 text-sm text-muted-foreground">Delivery and collection options available at checkout.</p>
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
              <img src={img} alt={product.name} className="h-20 w-full object-cover" loading="lazy" />
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
                <article key={review.id} className="border border-border rounded-xl p-4 bg-background">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 text-[#f4b400]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-border"}`} />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">{review.date}</div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Overall fit: {review.fit} · Size: {review.size}</div>
                  <p className="mt-3 text-sm leading-relaxed">{review.text}</p>
                  {review.photos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.photos.map((photo) => (
                        <img key={photo} src={photo} alt="Review image" className="h-16 w-16 rounded object-cover border border-border" loading="lazy" />
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {alsoViewed.length > 0 && (
        <section className="mx-auto max-w-350 px-6 pb-16">
          <h2 className="text-4xl font-semibold tracking-tight mb-6">Customers Also Viewed</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {alsoViewed.map((p) => (
              <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="group rounded-lg border border-border overflow-hidden bg-background hover:shadow-md transition">
                <div className="aspect-3/4 overflow-hidden">
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
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
