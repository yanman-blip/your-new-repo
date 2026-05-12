import { createFileRoute } from "@tanstack/react-router";
import { products, type Brand } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop iPhone & Samsung phones — Kingpin Electronics" },
      { name: "description", content: "Browse every iPhone and Samsung Galaxy phone. Authorized retailer with free shipping, trade-in, and 2-year warranty." },
    ],
  }),
  component: Shop,
});

type BrandFilter = "All" | Brand;
type PriceFilter = "All" | "Under $1000" | "$1000–$1500" | "$1500+";

function Shop() {
  const [brand, setBrand] = useState<BrandFilter>("All");
  const [price, setPrice] = useState<PriceFilter>("All");
  const [sort, setSort] = useState<"featured" | "low" | "high">("featured");

  const filtered = useMemo(() => {
    let list = products.filter((p) => (brand === "All" ? true : p.brand === brand));
    if (price !== "All") {
      list = list.filter((p) => {
        if (price === "Under $1000") return p.price < 1000;
        if (price === "$1000–$1500") return p.price >= 1000 && p.price < 1500;
        return p.price >= 1500;
      });
    }
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [brand, price, sort]);

  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 pb-24">
      <div className="max-w-2xl">
        <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Shop</span>
        <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tight">All phones.</h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Every iPhone. Every Galaxy. Authorized, certified, and ready to ship.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex flex-wrap gap-2 text-sm">
          {(["All", "Apple", "Samsung"] as BrandFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setBrand(f)}
              className={`px-4 py-2 rounded-full border transition-colors ${brand === f ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
            >
              {f}
            </button>
          ))}
          <span className="w-px bg-border mx-2" />
          {(["All", "Under $1000", "$1000–$1500", "$1500+"] as PriceFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setPrice(f)}
              className={`px-4 py-2 rounded-full border transition-colors ${price === f ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:border-foreground/40"
        >
          <option value="featured">Featured</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">{filtered.length} phone{filtered.length === 1 ? "" : "s"}</div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 text-center py-20 text-muted-foreground">
            No phones match these filters.
          </div>
        ) : (
          filtered.map((p) => <ProductCard key={p.id} p={p} />)
        )}
      </div>
    </section>
  );
}
