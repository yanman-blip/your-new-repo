import { createFileRoute } from "@tanstack/react-router";
import { type Collection } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { useState, useMemo, useEffect } from "react";
import { useProducts } from "@/lib/use-products";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { SlidersHorizontal } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/shop")({
  validateSearch: z.object({
    collection: z.string().optional(),
    price: z.string().optional(),
    sort: z.string().optional(),
    q: z.string().optional(),
    sizes: z.string().optional(),
    colors: z.string().optional(),
    badges: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Shop lingerie, silk & lounge - WET LACE" },
      { name: "description", content: "Shop the WET LACE collection: French lace bralettes, mulberry silk slips, satin robes and Pima cotton essentials. Free 30-day exchanges." },
    ],
  }),
  component: Shop,
});

type CollectionFilter = "All" | Collection;
type PriceFilter = "All" | "Under $100" | "$100–$150" | "$150+";
type SortFilter = "featured" | "low" | "high" | "newest";

const collectionFilters: CollectionFilter[] = ["All", "Lace", "Silk", "Lounge", "Everyday"];
const priceFilters: PriceFilter[] = ["All", "Under $100", "$100–$150", "$150+"];

function parseFacetParam(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

type FacetPanelProps = {
  collection: CollectionFilter;
  setCollection: (value: CollectionFilter) => void;
  price: PriceFilter;
  setPrice: (value: PriceFilter) => void;
  availableSizes: string[];
  selectedSizes: string[];
  setSelectedSizes: (next: string[]) => void;
  availableColors: string[];
  selectedColors: string[];
  setSelectedColors: (next: string[]) => void;
  availableBadges: string[];
  selectedBadges: string[];
  setSelectedBadges: (next: string[]) => void;
  clearAllFacets: () => void;
  onDone?: () => void;
};

function FacetPanel({
  collection,
  setCollection,
  price,
  setPrice,
  availableSizes,
  selectedSizes,
  setSelectedSizes,
  availableColors,
  selectedColors,
  setSelectedColors,
  availableBadges,
  selectedBadges,
  setSelectedBadges,
  clearAllFacets,
  onDone,
}: FacetPanelProps) {
  const toggleFacet = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Filters</h2>
        <button type="button" onClick={clearAllFacets} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Collection</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {collectionFilters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setCollection(f)}
              className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${collection === f ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Price</h3>
        <div className="mt-2 space-y-2">
          {priceFilters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setPrice(f)}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${price === f ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Sizes</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {availableSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleFacet(size, selectedSizes, setSelectedSizes)}
              className={`min-w-10 rounded-md border px-2 py-1 text-xs ${selectedSizes.includes(size) ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Colors</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {availableColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => toggleFacet(color, selectedColors, setSelectedColors)}
              className={`rounded-full border px-3 py-1 text-xs ${selectedColors.includes(color) ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {availableBadges.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Merch Tags</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableBadges.map((badge) => (
              <button
                key={badge}
                type="button"
                onClick={() => toggleFacet(badge, selectedBadges, setSelectedBadges)}
                className={`rounded-full border px-3 py-1 text-xs ${selectedBadges.includes(badge) ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
              >
                {badge}
              </button>
            ))}
          </div>
        </div>
      )}

      {onDone && (
        <DrawerFooter className="px-0 pb-0">
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background"
          >
            View results
          </button>
        </DrawerFooter>
      )}
    </>
  );
}

function Shop() {
  const products = useProducts();
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const initialCollection = collectionFilters.includes(searchParams.collection as CollectionFilter)
    ? (searchParams.collection as CollectionFilter)
    : "All";
  const initialPrice = priceFilters.includes(searchParams.price as PriceFilter)
    ? (searchParams.price as PriceFilter)
    : "All";
  const initialSort: SortFilter = ["featured", "low", "high", "newest"].includes(searchParams.sort ?? "")
    ? (searchParams.sort as SortFilter)
    : "featured";

  const [collection, setCollection] = useState<CollectionFilter>(initialCollection);
  const [price, setPrice] = useState<PriceFilter>(initialPrice);
  const [sort, setSort] = useState<SortFilter>(initialSort);
  const [search, setSearch] = useState(searchParams.q ?? "");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(parseFacetParam(searchParams.sizes));
  const [selectedColors, setSelectedColors] = useState<string[]>(parseFacetParam(searchParams.colors));
  const [selectedBadges, setSelectedBadges] = useState<string[]>(parseFacetParam(searchParams.badges));
  const [maxVisible, setMaxVisible] = useState(16);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const availableSizes = useMemo(() => {
    const allSizes = new Set<string>();
    for (const p of products) {
      for (const size of p.storage) allSizes.add(size);
    }
    return Array.from(allSizes);
  }, [products]);

  const availableColors = useMemo(() => {
    const allColors = new Set<string>();
    for (const p of products) {
      for (const color of p.colors) allColors.add(color.name);
    }
    return Array.from(allColors);
  }, [products]);

  const availableBadges = useMemo(() => {
    const allBadges = new Set<string>();
    for (const p of products) {
      if (p.badge) allBadges.add(p.badge);
    }
    return Array.from(allBadges);
  }, [products]);

  const clearAllFacets = () => {
    setCollection("All");
    setPrice("All");
    setSearch("");
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedBadges([]);
    setSort("featured");
    setMaxVisible(16);
  };

  useEffect(() => {
    const urlCollection = collectionFilters.includes(searchParams.collection as CollectionFilter)
      ? (searchParams.collection as CollectionFilter)
      : "All";
    const urlPrice = priceFilters.includes(searchParams.price as PriceFilter)
      ? (searchParams.price as PriceFilter)
      : "All";
    const urlSort: SortFilter = ["featured", "low", "high", "newest"].includes(searchParams.sort ?? "")
      ? (searchParams.sort as SortFilter)
      : "featured";

    setCollection(urlCollection);
    setPrice(urlPrice);
    setSort(urlSort);
    setSearch(searchParams.q ?? "");
    setSelectedSizes(parseFacetParam(searchParams.sizes));
    setSelectedColors(parseFacetParam(searchParams.colors));
    setSelectedBadges(parseFacetParam(searchParams.badges));
  }, [searchParams]);

  useEffect(() => {
    navigate({
      replace: true,
      search: (prev) => ({
        ...prev,
        collection: collection === "All" ? undefined : collection,
        price: price === "All" ? undefined : price,
        sort: sort === "featured" ? undefined : sort,
        q: search.trim() ? search.trim() : undefined,
        sizes: selectedSizes.length > 0 ? selectedSizes.join(",") : undefined,
        colors: selectedColors.length > 0 ? selectedColors.join(",") : undefined,
        badges: selectedBadges.length > 0 ? selectedBadges.join(",") : undefined,
      }),
    });
  }, [navigate, collection, price, sort, search, selectedSizes, selectedColors, selectedBadges]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => (collection === "All" ? true : p.brand === collection));
    if (price !== "All") {
      list = list.filter((p) => {
        if (price === "Under $100") return p.price < 100;
        if (price === "$100–$150") return p.price >= 100 && p.price < 150;
        return p.price >= 150;
      });
    }
    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tagline.toLowerCase().includes(query)
      );
    }
    if (selectedSizes.length > 0) {
      list = list.filter((p) => selectedSizes.some((size) => p.storage.includes(size)));
    }
    if (selectedColors.length > 0) {
      list = list.filter((p) => p.colors.some((c) => selectedColors.includes(c.name)));
    }
    if (selectedBadges.length > 0) {
      list = list.filter((p) => p.badge && selectedBadges.includes(p.badge));
    }

    if (sort === "newest") {
      list = [...list].sort((a, b) => b.id.localeCompare(a.id));
    }
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [collection, price, sort, search, selectedSizes, selectedColors, selectedBadges, products]);

  useEffect(() => {
    setMaxVisible(16);
  }, [collection, price, sort, search, selectedSizes, selectedColors, selectedBadges]);

  const visibleProducts = filtered.slice(0, maxVisible);
  const hasMore = visibleProducts.length < filtered.length;

  const activeFilterChips = [
    collection !== "All" ? `Collection: ${collection}` : null,
    price !== "All" ? `Price: ${price}` : null,
    ...selectedSizes.map((size) => `Size: ${size}`),
    ...selectedColors.map((color) => `Color: ${color}`),
    ...selectedBadges.map((badge) => `Tag: ${badge}`),
  ].filter(Boolean) as string[];

  return (
    <section className="mx-auto max-w-375 px-4 md:px-6 pt-12 pb-24">
      <div className="rounded-2xl border border-[#efd8cd] bg-linear-to-r from-[#fff7f1] via-[#fff2eb] to-[#ffe9de] px-5 py-4 text-[#b4512c] text-sm font-medium">
        Flash Sale: up to 53% OFF lingerie picks + extra offers on multi-item carts.
      </div>

      <div className="mt-6 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Women Sexy Lingerie & Costumes</h1>
        <p className="mt-2 text-muted-foreground">SHEIN-style browsing for your lingerie-first catalog: filter fast, compare quickly, buy instantly.</p>
      </div>

      <div className="mt-6 max-w-md">
        <input
          type="text"
          placeholder="Search lingerie, babydolls, mesh, lace..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
          aria-label="Search products"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden h-fit rounded-2xl border border-border bg-background p-4 lg:block lg:sticky lg:top-20">
          <FacetPanel
            collection={collection}
            setCollection={setCollection}
            price={price}
            setPrice={setPrice}
            availableSizes={availableSizes}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
            availableColors={availableColors}
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
            availableBadges={availableBadges}
            selectedBadges={selectedBadges}
            setSelectedBadges={setSelectedBadges}
            clearAllFacets={clearAllFacets}
          />
        </aside>

        <div>
          <div className="sticky top-16 z-10 mb-3 rounded-xl border border-border bg-background/95 px-4 py-3 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Drawer open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <DrawerTrigger asChild>
                    <button type="button" className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs lg:hidden">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Filters
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[85vh] overflow-y-auto px-4 pb-4">
                    <DrawerHeader className="px-0">
                      <DrawerTitle>Filter & Refine</DrawerTitle>
                      <DrawerDescription>Find your fit by size, color, price, and style.</DrawerDescription>
                    </DrawerHeader>
                    <FacetPanel
                      collection={collection}
                      setCollection={setCollection}
                      price={price}
                      setPrice={setPrice}
                      availableSizes={availableSizes}
                      selectedSizes={selectedSizes}
                      setSelectedSizes={setSelectedSizes}
                      availableColors={availableColors}
                      selectedColors={selectedColors}
                      setSelectedColors={setSelectedColors}
                      availableBadges={availableBadges}
                      selectedBadges={selectedBadges}
                      setSelectedBadges={setSelectedBadges}
                      clearAllFacets={clearAllFacets}
                      onDone={() => setMobileFiltersOpen(false)}
                    />
                  </DrawerContent>
                </Drawer>
                <span className="font-semibold">{filtered.length}</span> products
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground">Sort</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortFilter)}
                  aria-label="Sort products"
                  title="Sort products"
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:border-foreground/40"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                </select>
              </div>
            </div>
            {activeFilterChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <span key={chip} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{chip}</span>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                Nothing matches these filters.
              </div>
            ) : (
              visibleProducts.map((p) => <ProductCard key={p.id} p={p} clean />)
            )}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setMaxVisible((v) => v + 16)}
                className="rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:border-foreground/40"
              >
                Load more lingerie
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
