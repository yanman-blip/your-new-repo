import { createFileRoute } from "@tanstack/react-router";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop all phones — Orbit" },
      { name: "description", content: "Browse every Orbit phone: Pro, Foldable, Air, and Mini. Free shipping, trade-in, and 2-year warranty included." },
    ],
  }),
  component: Shop,
});

function Shop() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 pb-24">
      <div className="max-w-2xl">
        <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Shop</span>
        <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tight">All phones.</h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Every model. Every finish. Filter, compare, and find the one made for you.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-2 text-sm">
        {["All", "Pro", "Foldable", "Compact", "Under $1000"].map((f, i) => (
          <button
            key={f}
            className={`px-4 py-2 rounded-full border transition-colors ${i===0 ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-2">
        {products.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
