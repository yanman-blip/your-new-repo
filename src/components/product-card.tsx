import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format-price";

type ProductCardProps = {
  p: Product;
  large?: boolean;
  overlayText?: boolean;
  clean?: boolean;
};

export function ProductCard({ p, large = false, overlayText = false, clean = false }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const galleryImages = p.gallery && p.gallery.length > 0 ? p.gallery : [p.image];

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
          {p.brand && (
            <span className="absolute top-2 left-2 rounded-sm bg-white/85 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-neutral-700">
              {p.brand}
            </span>
          )}
          {p.badge && (
            <span className="absolute top-2 right-2 rounded-sm bg-black px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-white">
              {p.badge}
            </span>
          )}
        </div>
        {/* Text below */}
        <div className="px-2 py-3">
          <p className="text-xs text-neutral-500 mb-0.5 uppercase tracking-wide">{p.brand}</p>
          <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">{p.name}</h3>
          <p className="mt-1.5 text-sm font-semibold text-[#e14f2a]">{formatPrice(p.price, p.id)}</p>
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
