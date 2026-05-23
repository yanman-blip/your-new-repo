import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format-price";
import { Eye, Heart, Star } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getProductRating(id: string): { avg: number; count: number } {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) & 0xffffffff;
  const avg = 4.5 + (Math.abs(hash % 6) / 10); // 4.5 – 5.0
  const count = 50 + Math.abs(hash % 950); // 50 – 999
  return { avg: Math.min(5, avg), count };
}

function getSalePercent(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 33 + char.charCodeAt(0)) & 0xffffffff;
  const discountBands = [12, 18, 25, 30, 35];
  return discountBands[Math.abs(hash) % discountBands.length];
}

type ProductCardProps = {
  p: Product;
  large?: boolean;
  overlayText?: boolean;
  clean?: boolean;
  recommendationReason?: string;
  onClick?: () => void;
};

function getBadgeColor(badge?: string): { bg: string; text: string } {
  if (!badge) return { bg: "", text: "" };
  switch (badge.toLowerCase()) {
    case "new":
      return { bg: "bg-green-600", text: "text-white" };
    case "low stock":
      return { bg: "bg-orange-600", text: "text-white" };
    case "best seller":
      return { bg: "bg-red-600", text: "text-white" };
    default:
      return { bg: "bg-black", text: "text-white" };
  }
}

function getColorSwatchClass(colorName: string): string {
  const token = colorName.trim().toLowerCase();
  switch (token) {
    case "black":
      return "bg-[#1c1c1e]";
    case "white":
      return "bg-[#f5f3ee]";
    case "red":
      return "bg-[#aa1b2a]";
    case "pink":
      return "bg-[#f3c4cd]";
    case "burgundy":
      return "bg-[#7b1f2b]";
    case "blue":
      return "bg-[#2c4f9e]";
    case "green":
      return "bg-[#4f6f52]";
    case "grey":
    case "gray":
      return "bg-[#7d7d82]";
    case "cream":
      return "bg-[#ece4d6]";
    case "brown":
      return "bg-[#7a5230]";
    default:
      return "bg-neutral-300";
  }
}

export function ProductCard({ p, large = false, overlayText = false, clean = false, recommendationReason, onClick }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickSize, setQuickSize] = useState(p.storage[0] ?? "One Size");
  const [quickColor, setQuickColor] = useState(p.colors[0]?.name ?? "Default");
  const galleryImages = p.gallery && p.gallery.length > 0 ? p.gallery : [p.image];
  const { isWishlisted, toggle } = useWishlist();
  const { add, setOpen } = useCart();
  const wishlisted = isWishlisted(p.id);
  const salePercent = getSalePercent(p.id);
  const compareAt = Math.round((p.price / (1 - salePercent / 100)) * 100) / 100;
  const primaryColor = p.colors[0]?.name ?? "Default";
  const primarySize = p.storage[0] ?? "One Size";

  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [galleryImages.length]);

  const currentImage = galleryImages[currentImageIndex];

  if (clean) {
    return (
      <>
        <Link
          to="/product/$id"
          params={{ id: p.id }}
          onClick={onClick}
          className="group block w-full overflow-hidden rounded-xl bg-white transition-shadow hover:shadow-md"
        >
          {/* Image */}
          <div className="relative aspect-3/4 overflow-hidden bg-neutral-100">
            <img
              src={currentImage}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
              <span className="rounded-sm bg-[#1f1f1f]/85 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-white">
                -{salePercent}%
              </span>
              {p.brand && (
                <span className="rounded-sm bg-white/85 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-neutral-700">
                  {p.brand}
                </span>
              )}
            </div>
            {p.badge && (
              <span className={`absolute top-2 right-2 rounded-sm px-2 py-1 text-[10px] uppercase tracking-widest font-semibold ${getBadgeColor(p.badge).bg} ${getBadgeColor(p.badge).text}`}>
                {p.badge}
              </span>
            )}
            {/* Wishlist heart */}
            <button
              type="button"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={(e) => { e.preventDefault(); toggle(p.id); }}
              className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Heart className={`h-4 w-4 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-neutral-500"}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                add({ productId: p.id, storage: primarySize, color: primaryColor, qty: 1 });
                setOpen(true);
              }}
              className="absolute inset-x-3 bottom-3 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-neutral-900 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
            >
              Quick add
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setQuickViewOpen(true);
              }}
              className="absolute right-2 top-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4 text-neutral-700" />
            </button>
          </div>
          {/* Text below */}
          <div className="px-2 py-3">
            <p className="text-[10px] text-neutral-500 mb-0.5 uppercase tracking-[0.14em]">{p.brand}</p>
            <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">{p.name}</h3>
            {recommendationReason && (
              <p className="mt-1 inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                {recommendationReason}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{formatPrice(p.price, p.id)}</p>
              <p className="text-xs text-neutral-400 line-through">{formatPrice(compareAt, p.id)}</p>
            </div>

            <div className="mt-1.5 flex items-center gap-1">
              {p.colors.slice(0, 5).map((color) => (
                <span
                  key={color.name}
                  title={color.name}
                  className={`h-3.5 w-3.5 rounded-full border border-neutral-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] ${getColorSwatchClass(color.name)}`}
                />
              ))}
              {p.colors.length > 5 && <span className="ml-0.5 text-[10px] text-neutral-400">+{p.colors.length - 5}</span>}
            </div>

            {(() => { const r = getProductRating(p.id); return (
              <div className="mt-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < Math.round(r.avg) ? "fill-[#f4b400] text-[#f4b400]" : "fill-neutral-200 text-neutral-200"}`} />
                ))}
                <span className="text-[10px] text-neutral-400 ml-0.5">{r.avg.toFixed(1)} ({r.count > 999 ? "1000+" : r.count})</span>
              </div>
            ); })()}
          </div>
        </Link>

        <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{p.name}</DialogTitle>
              <DialogDescription>{p.tagline}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
              <div className="aspect-3/4 overflow-hidden rounded-lg bg-muted">
                <img src={currentImage} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-[#fe2c55]">{formatPrice(p.price, p.id)}</p>
                  <p className="text-sm text-neutral-400 line-through">{formatPrice(compareAt, p.id)}</p>
                  <span className="text-xs font-semibold text-[#fe2c55]">-{salePercent}%</span>
                </div>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Color</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setQuickColor(color.name)}
                      className={`rounded-full border px-3 py-1 text-xs ${quickColor === color.name ? "border-foreground bg-foreground text-background" : "border-border"}`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Size</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.storage.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setQuickSize(size)}
                      className={`min-w-10 rounded-md border px-2 py-1 text-xs ${quickSize === size ? "border-foreground bg-foreground text-background" : "border-border"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => {
                  add({ productId: p.id, storage: quickSize, color: quickColor, qty: 1 });
                  setOpen(true);
                  setQuickViewOpen(false);
                }}
                className="w-full rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
              >
                Add to bag
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (overlayText) {
    return (
      <Link
        to="/product/$id"
        params={{ id: p.id }}
        className={`group relative block w-full overflow-hidden rounded-3xl ${p.bg} ${p.accent} ${large ? "min-h-155" : "min-h-125"} transition-transform duration-500 hover:-translate-y-1`}
      >
        <img
          src={currentImage}
          alt={p.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/78 via-black/35 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-8 text-white">
          <div className="max-w-xl drop-shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-black/45 px-2.5 py-1 text-xs uppercase tracking-[0.2em] opacity-100">{p.brand}</span>
              {p.badge && (
                <span className="rounded-full bg-white/25 px-2.5 py-1 text-[10px] uppercase tracking-widest opacity-100">
                  {p.badge}
                </span>
              )}
            </div>
            <h3 className={`font-semibold tracking-tight ${large ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"}`}>
              {p.name}
            </h3>
            <p className={`mt-2 max-w-md rounded-lg bg-black/45 px-2.5 py-1.5 opacity-100 ${large ? "text-lg" : "text-base"}`}>{p.tagline}</p>
            <p className="mt-4 inline-block rounded-full bg-black/55 px-3.5 py-1.5 text-base font-medium opacity-100">From ${p.price.toLocaleString()}</p>
          </div>

          <div className="mt-4 flex gap-3 text-sm">
            <span className="rounded-full bg-white px-4 py-2 font-medium text-black">Buy</span>
            <span className="rounded-full border border-white/90 px-4 py-2 text-white">Learn more</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className={`group relative overflow-hidden rounded-3xl ${p.bg} ${p.accent} ${large ? "min-h-155" : "min-h-125"} flex flex-col p-8 md:p-10 transition-transform duration-500 hover:-translate-y-1`}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs uppercase tracking-[0.2em] opacity-60">{p.brand}</span>
          {p.badge && (
            <span className="text-[10px] uppercase tracking-widest bg-current/10 px-2 py-0.5 rounded-full opacity-80">
              {p.badge}
            </span>
          )}
        </div>
        <h3 className={`font-semibold tracking-tight ${large ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"}`}>
          {p.name}
        </h3>
        <p className="mt-2 opacity-80 max-w-md">{p.tagline}</p>
        <p className="mt-4 text-sm opacity-70">From ${p.price.toLocaleString()}</p>
      </div>
      <div className={`relative mt-6 ${large ? "h-90 md:h-107.5" : "h-70 md:h-85"}`}>
        <img
          src={currentImage}
          alt={p.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.06]"
        />
      </div>
      <div className="relative z-10 flex gap-3 text-sm">
        <span className="px-4 py-2 rounded-full bg-foreground text-background font-medium">Buy</span>
        <span className="px-4 py-2 rounded-full border border-current/30 opacity-80">Learn more</span>
      </div>
    </Link>
  );
}
