import { createFileRoute } from "@tanstack/react-router";
import { products, type Collection } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop lingerie, silk & lounge — LOFTIE" },
      { name: "description", content: "Shop the LOFTIE collection: French lace bralettes, mulberry silk slips, satin robes and Pima cotton essentials. Free 30-day exchanges." },
    ],
  }),
  component: Shop,
});

type CollectionFilter = "All" | Collection;
type PriceFilter = "All" | "Under $100" | "$100–$150" | "$150+";

function Shop() {
  const [collection, setCollection] = useState<CollectionFilter>("All");
  const [price, setPrice] = useState<PriceFilter>("All");
  const [sort, setSort] = useState<"featured" | "low" | "high">("featured");

  const filtered = useMemo(() => {
    let list = products.filter((p) => (collection === "All" ? true : p.brand === collection));
    if (price !== "All") {
      list = list.filter((p) => {
        if (price === "Under $100") return p.price < 100;
        if (price === "$100–$150") return p.price >= 100 && p.price < 150;
        return p.price >= 150;
      });
    }
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [collection, price, sort]);

  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 pb-24">
      <div className="max-w-2xl">
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">The collection</span>
        <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tight">Everything we make.</h1>
        <p className="mt-4 text-muted-foreground text-lg">
          A small, considered collection of lingerie, silk and lounge — designed in Paris, made ethically in Portugal.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex flex-wrap gap-2 text-sm">
          {(["All", "Lace", "Silk", "Lounge", "Everyday"] as CollectionFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setCollection(f)}
              className={`px-4 py-2 rounded-full border transition-colors ${collection === f ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
            >
              {f}
            </button>
          ))}
          <span className="w-px bg-border mx-2" />
          {(["All", "Under $100", "$100–$150", "$150+"] as PriceFilter[]).map((f) => (
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

      <div className="mt-3 text-xs text-muted-foreground">{filtered.length} piece{filtered.length === 1 ? "" : "s"}</div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 text-center py-20 text-muted-foreground">
            Nothing matches these filters.
          </div>
        ) : (
          filtered.map((p) => <ProductCard key={p.id} p={p} />)
        )}
      </div>
    </section>
  );
}
