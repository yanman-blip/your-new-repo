import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";

export function ProductCard({ p, large = false }: { p: Product; large?: boolean }) {
  return (
    <Link
      to="/shop"
      className={`group relative overflow-hidden rounded-3xl ${p.bg} ${p.accent} ${large ? "min-h-[560px]" : "min-h-[440px]"} flex flex-col p-8 md:p-10 transition-transform duration-500 hover:-translate-y-1`}
    >
      <div className="relative z-10">
        {p.badge && (
          <span className="inline-block text-xs uppercase tracking-[0.2em] opacity-70 mb-3">
            {p.badge}
          </span>
        )}
        <h3 className={`font-semibold tracking-tight ${large ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"}`}>
          {p.name}
        </h3>
        <p className="mt-2 opacity-80 max-w-md">{p.tagline}</p>
        <p className="mt-4 text-sm opacity-70">From ${p.price.toLocaleString()}</p>
      </div>
      <div className="flex-1 relative mt-6 -mx-4">
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div className="relative z-10 flex gap-3 text-sm">
        <span className="px-4 py-2 rounded-full bg-foreground text-background font-medium">Buy</span>
        <span className="px-4 py-2 rounded-full border border-current/30 opacity-80">Learn more</span>
      </div>
    </Link>
  );
}
