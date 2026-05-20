import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format-price";
import { Heart, Star } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";

function isSellingFast(id: string): boolean {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) & 0xffffffff;
  return (Math.abs(hash) % 5) === 0; // ~20% of products
}

function getProductRating(id: string): { avg: number; count: number } {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) & 0xffffffff;
  const avg = 4.5 + (Math.abs(hash % 6) / 10); // 4.5 – 5.0
  const count = 50 + Math.abs(hash % 950); // 50 – 999
  return { avg: Math.min(5, avg), count };
}

type ProductCardProps = {
  p: Product;
  large?: boolean;
  overlayText?: boolean;
  clean?: boolean;
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

export function ProductCard({ p, large = false, overlayText = false, clean = false }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const galleryImages = p.gallery && p.gallery.length > 0 ? p.gallery : [p.image];
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(p.id);
  const sellingFast = isSellingFast(p.id);

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
      <Link
        to="/product/$id"
        params={{ id: p.id }}
        className="group block w-full overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-brand/40 hover:shadow-[0_8px_30px_-12px_oklch(0.52_0.15_12/0.5)]"
      >
        {/* Image */}
        <div className="relative aspect-3/4 overflow-hidden bg-surface-2">
          <img
            src={currentImage}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
          />
          {p.brand && (
            <span className="absolute top-2 left-2 rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-white/90 backdrop-blur-sm">
              {p.brand}
            </span>
          )}
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
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className={`h-4 w-4 transition-colors ${wishlisted ? "fill-brand text-brand" : "text-white/80"}`} />
          </button>
        </div>
        {/* Text below */}
        <div className="px-2 py-3">
          <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">{p.brand}</p>
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{p.name}</h3>
          <div className="mt-1.5 flex items-center gap-2">
            <p className="text-sm font-semibold text-brand">{formatPrice(p.price, p.id)}</p>
            {sellingFast && !p.badge && (
              <span className="text-[10px] font-semibold text-[#d98a3d]">🔥 Selling fast</span>
            )}
          </div>
          {(() => { const r = getProductRating(p.id); return (
            <div className="mt-1 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.round(r.avg) ? "fill-[#d9a441] text-[#d9a441]" : "fill-white/15 text-white/15"}`} />
              ))}
              <span className="text-[10px] text-muted-foreground ml-0.5">{r.avg.toFixed(1)} ({r.count > 999 ? "1000+" : r.count})</span>
            </div>
          ); })()}
        </div>
      </Link>
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
