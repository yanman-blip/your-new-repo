import { createFileRoute } from "@tanstack/react-router";
import { type Collection } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { useState, useMemo, useEffect, useRef } from "react";
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
import { useRecentlyViewedProducts } from "@/lib/recently-viewed";
import { usePersonalizationSettings } from "@/lib/personalization";
import {
  trackRecommendationClick,
  trackRecommendationImpression,
} from "@/lib/recommendation-analytics";
import {
  type ProductTypeFilter,
  inferProductTypes,
  requestedProductTypes,
} from "@/lib/product-taxonomy";

export const Route = createFileRoute("/shop")({
  validateSearch: z.object({
    collection: z.string().optional(),
    price: z.string().optional(),
    sort: z.string().optional(),
    rank: z.string().optional(),
    q: z.string().optional(),
    sizes: z.string().optional(),
    colors: z.string().optional(),
    badges: z.string().optional(),
    types: z.string().optional(),
    occasions: z.string().optional(),
    fabrics: z.string().optional(),
    coverage: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Shop lingerie, silk & lounge - WET LACE" },
      {
        name: "description",
        content:
          "Shop the WET LACE collection: French lace bralettes, mulberry silk slips, satin robes and Pima cotton essentials. Free 30-day exchanges.",
      },
    ],
  }),
  component: Shop,
});

type CollectionFilter = "All" | Collection;
type PriceFilter = "All" | "Under $6.00" | "$6.00-$7.99" | "$8.00-$9.30";
type SortFilter = "featured" | "low" | "high" | "newest";
type RankStrategy = "personalized" | "merch";
type CoverageFilter = "All" | "Sheer" | "Semi-Sheer" | "Opaque";

const collectionFilters: CollectionFilter[] = ["All", "Lace", "Silk", "Lounge", "Everyday"];
const priceFilters: PriceFilter[] = ["All", "Under $6.00", "$6.00-$7.99", "$8.00-$9.30"];

function parseFacetParam(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toSearchTokens(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

function getLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
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
  availableTypes: ProductTypeFilter[];
  selectedTypes: ProductTypeFilter[];
  setSelectedTypes: (next: ProductTypeFilter[]) => void;
  availableOccasions: string[];
  selectedOccasions: string[];
  setSelectedOccasions: (next: string[]) => void;
  availableFabrics: string[];
  selectedFabrics: string[];
  setSelectedFabrics: (next: string[]) => void;
  coverage: CoverageFilter;
  setCoverage: (value: CoverageFilter) => void;
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
  availableTypes,
  selectedTypes,
  setSelectedTypes,
  availableOccasions,
  selectedOccasions,
  setSelectedOccasions,
  availableFabrics,
  selectedFabrics,
  setSelectedFabrics,
  coverage,
  setCoverage,
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
        <button
          type="button"
          onClick={clearAllFacets}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </button>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Collection
        </h3>
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
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Price
        </h3>
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
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Sizes
        </h3>
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
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Colors
        </h3>
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
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Merch Tags
          </h3>
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

      {availableTypes.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Product Type
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  toggleFacet(type, selectedTypes, (next) =>
                    setSelectedTypes(next as ProductTypeFilter[]),
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs ${selectedTypes.includes(type) ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableOccasions.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Occasion
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableOccasions.map((occasion) => (
              <button
                key={occasion}
                type="button"
                onClick={() => toggleFacet(occasion, selectedOccasions, setSelectedOccasions)}
                className={`rounded-full border px-3 py-1 text-xs ${selectedOccasions.includes(occasion) ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
              >
                {occasion}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableFabrics.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Fabric
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableFabrics.map((fabric) => (
              <button
                key={fabric}
                type="button"
                onClick={() => toggleFacet(fabric, selectedFabrics, setSelectedFabrics)}
                className={`rounded-full border px-3 py-1 text-xs ${selectedFabrics.includes(fabric) ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
              >
                {fabric}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Coverage
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["All", "Sheer", "Semi-Sheer", "Opaque"] as CoverageFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCoverage(value)}
              className={`rounded-full border px-3 py-1 text-xs ${coverage === value ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

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
  const recentlyViewed = useRecentlyViewedProducts(6);
  const { enabled: personalizationEnabled, toggle: togglePersonalization } =
    usePersonalizationSettings();
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const initialCollection = collectionFilters.includes(searchParams.collection as CollectionFilter)
    ? (searchParams.collection as CollectionFilter)
    : "All";
  const initialPrice = priceFilters.includes(searchParams.price as PriceFilter)
    ? (searchParams.price as PriceFilter)
    : "All";
  const initialSort: SortFilter = ["featured", "low", "high", "newest"].includes(
    searchParams.sort ?? "",
  )
    ? (searchParams.sort as SortFilter)
    : "featured";
  const initialRank: RankStrategy = ["personalized", "merch"].includes(searchParams.rank ?? "")
    ? (searchParams.rank as RankStrategy)
    : "personalized";
  const initialCoverage: CoverageFilter = ["All", "Sheer", "Semi-Sheer", "Opaque"].includes(
    searchParams.coverage ?? "",
  )
    ? (searchParams.coverage as CoverageFilter)
    : "All";

  const [collection, setCollection] = useState<CollectionFilter>(initialCollection);
  const [price, setPrice] = useState<PriceFilter>(initialPrice);
  const [sort, setSort] = useState<SortFilter>(initialSort);
  const [rankStrategy, setRankStrategy] = useState<RankStrategy>(initialRank);
  const [search, setSearch] = useState(searchParams.q ?? "");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(parseFacetParam(searchParams.sizes));
  const [selectedColors, setSelectedColors] = useState<string[]>(
    parseFacetParam(searchParams.colors),
  );
  const [selectedBadges, setSelectedBadges] = useState<string[]>(
    parseFacetParam(searchParams.badges),
  );
  const [selectedTypes, setSelectedTypes] = useState<ProductTypeFilter[]>(
    parseFacetParam(searchParams.types).filter((item): item is ProductTypeFilter =>
      requestedProductTypes.includes(item as ProductTypeFilter),
    ),
  );
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    parseFacetParam(searchParams.occasions),
  );
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>(
    parseFacetParam(searchParams.fabrics),
  );
  const [coverage, setCoverage] = useState<CoverageFilter>(initialCoverage);
  const [maxVisible, setMaxVisible] = useState(16);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

  const availableTypes = useMemo(() => {
    const allTypes = new Set<ProductTypeFilter>();
    for (const product of products) {
      for (const type of inferProductTypes(product)) allTypes.add(type);
    }
    const preferred = requestedProductTypes.filter((type) => allTypes.has(type));
    return preferred.length > 0 ? preferred : requestedProductTypes;
  }, [products]);

  const availableOccasions = useMemo(() => {
    const allOccasions = new Set<string>();
    for (const p of products) {
      for (const occasion of p.attributes?.occasions ?? []) allOccasions.add(occasion);
    }
    return Array.from(allOccasions);
  }, [products]);

  const availableFabrics = useMemo(() => {
    const allFabrics = new Set<string>();
    for (const p of products) {
      for (const fabric of p.attributes?.fabrics ?? []) allFabrics.add(fabric);
    }
    return Array.from(allFabrics);
  }, [products]);

  const searchVocabulary = useMemo(() => {
    const words = new Set<string>();
    for (const product of products) {
      const source = [
        product.name,
        product.tagline,
        product.description,
        product.badge ?? "",
        ...(product.attributes?.fabrics ?? []),
        ...(product.attributes?.occasions ?? []),
        ...(product.attributes?.styles ?? []),
      ].join(" ");
      for (const token of toSearchTokens(source)) {
        if (token.length >= 3) words.add(token);
      }
    }
    return Array.from(words);
  }, [products]);

  const searchSuggestions = useMemo(() => {
    const query = search.trim();
    if (!query) return [] as string[];

    const tokens = toSearchTokens(query);
    if (tokens.length === 0) return [] as string[];

    const suggestions = new Set<string>();
    for (const token of tokens) {
      let bestCandidate = "";
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const candidate of searchVocabulary) {
        if (candidate === token) continue;
        if (Math.abs(candidate.length - token.length) > 2) continue;
        const distance = getLevenshteinDistance(token, candidate);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCandidate = candidate;
        }
      }
      if (bestCandidate && bestDistance <= 2) {
        const suggestion = tokens
          .map((value) => (value === token ? bestCandidate : value))
          .join(" ");
        if (suggestion !== tokens.join(" ")) suggestions.add(suggestion);
      }
    }

    return Array.from(suggestions).slice(0, 4);
  }, [search, searchVocabulary]);

  const topSuggestion = searchSuggestions[0];

  const recentIds = useMemo(() => new Set(recentlyViewed.map((p) => p.id)), [recentlyViewed]);
  const recentBrands = useMemo(() => new Set(recentlyViewed.map((p) => p.brand)), [recentlyViewed]);
  const recentNameTokens = useMemo(() => {
    const tokens = new Set<string>();
    for (const product of recentlyViewed) {
      for (const token of product.name.toLowerCase().split(/[^a-z0-9]+/)) {
        if (token.length >= 4) tokens.add(token);
      }
    }
    return tokens;
  }, [recentlyViewed]);

  const clearAllFacets = () => {
    setCollection("All");
    setPrice("All");
    setSearch("");
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedBadges([]);
    setSelectedTypes([]);
    setSelectedOccasions([]);
    setSelectedFabrics([]);
    setCoverage("All");
    setSort("featured");
    setRankStrategy("personalized");
    setMaxVisible(16);
  };

  useEffect(() => {
    if (!personalizationEnabled && rankStrategy === "personalized") {
      setRankStrategy("merch");
    }
  }, [personalizationEnabled, rankStrategy]);

  useEffect(() => {
    for (const product of recentlyViewed) {
      trackRecommendationImpression("shop-continue-shopping", product.id);
    }
  }, [recentlyViewed]);

  useEffect(() => {
    const urlCollection = collectionFilters.includes(searchParams.collection as CollectionFilter)
      ? (searchParams.collection as CollectionFilter)
      : "All";
    const urlPrice = priceFilters.includes(searchParams.price as PriceFilter)
      ? (searchParams.price as PriceFilter)
      : "All";
    const urlSort: SortFilter = ["featured", "low", "high", "newest"].includes(
      searchParams.sort ?? "",
    )
      ? (searchParams.sort as SortFilter)
      : "featured";
    const urlRank: RankStrategy = ["personalized", "merch"].includes(searchParams.rank ?? "")
      ? (searchParams.rank as RankStrategy)
      : "personalized";
    const urlCoverage: CoverageFilter = ["All", "Sheer", "Semi-Sheer", "Opaque"].includes(
      searchParams.coverage ?? "",
    )
      ? (searchParams.coverage as CoverageFilter)
      : "All";

    setCollection(urlCollection);
    setPrice(urlPrice);
    setSort(urlSort);
    setRankStrategy(urlRank);
    setSearch(searchParams.q ?? "");
    setSelectedSizes(parseFacetParam(searchParams.sizes));
    setSelectedColors(parseFacetParam(searchParams.colors));
    setSelectedBadges(parseFacetParam(searchParams.badges));
    setSelectedTypes(
      parseFacetParam(searchParams.types).filter((item): item is ProductTypeFilter =>
        requestedProductTypes.includes(item as ProductTypeFilter),
      ),
    );
    setSelectedOccasions(parseFacetParam(searchParams.occasions));
    setSelectedFabrics(parseFacetParam(searchParams.fabrics));
    setCoverage(urlCoverage);
  }, [searchParams]);

  useEffect(() => {
    navigate({
      replace: true,
      search: (prev) => ({
        ...prev,
        collection: collection === "All" ? undefined : collection,
        price: price === "All" ? undefined : price,
        sort: sort === "featured" ? undefined : sort,
        rank: rankStrategy === "personalized" ? undefined : rankStrategy,
        q: search.trim() ? search.trim() : undefined,
        sizes: selectedSizes.length > 0 ? selectedSizes.join(",") : undefined,
        colors: selectedColors.length > 0 ? selectedColors.join(",") : undefined,
        badges: selectedBadges.length > 0 ? selectedBadges.join(",") : undefined,
        types: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
        occasions: selectedOccasions.length > 0 ? selectedOccasions.join(",") : undefined,
        fabrics: selectedFabrics.length > 0 ? selectedFabrics.join(",") : undefined,
        coverage: coverage === "All" ? undefined : coverage,
      }),
    });
  }, [
    navigate,
    collection,
    price,
    sort,
    rankStrategy,
    search,
    selectedSizes,
    selectedColors,
    selectedBadges,
    selectedTypes,
    selectedOccasions,
    selectedFabrics,
    coverage,
  ]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => (collection === "All" ? true : p.brand === collection));
    const searchScores = new Map<string, number>();

    const scoreSearchMatch = (
      product: (typeof products)[number],
      query: string,
      queryTokens: string[],
    ) => {
      const name = product.name.toLowerCase();
      const tagline = product.tagline.toLowerCase();
      const description = product.description.toLowerCase();
      const badge = (product.badge ?? "").toLowerCase();
      const fabrics = (product.attributes?.fabrics ?? []).join(" ").toLowerCase();
      const occasions = (product.attributes?.occasions ?? []).join(" ").toLowerCase();
      const styles = (product.attributes?.styles ?? []).join(" ").toLowerCase();

      let score = 0;
      if (name.includes(query)) score += 90;
      if (tagline.includes(query)) score += 45;
      if (description.includes(query)) score += 30;
      if (badge.includes(query)) score += 20;
      if (fabrics.includes(query)) score += 18;
      if (occasions.includes(query)) score += 16;
      if (styles.includes(query)) score += 14;

      for (const token of queryTokens) {
        if (token.length < 2) continue;
        if (name.includes(token)) score += 16;
        if (tagline.includes(token)) score += 9;
        if (description.includes(token)) score += 6;
        if (badge.includes(token)) score += 4;
        if (fabrics.includes(token) || occasions.includes(token) || styles.includes(token))
          score += 5;

        if (!name.includes(token) && !tagline.includes(token) && !description.includes(token)) {
          const productTokens = toSearchTokens(
            `${name} ${tagline} ${description} ${fabrics} ${occasions} ${styles}`,
          );
          const fuzzyMatch = productTokens.some((productToken) => {
            if (Math.abs(productToken.length - token.length) > 2) return false;
            return getLevenshteinDistance(productToken, token) <= 1;
          });
          if (fuzzyMatch) score += 4;
        }
      }

      return score;
    };

    if (price !== "All") {
      list = list.filter((p) => {
        if (price === "Under $6.00") return p.price < 6;
        if (price === "$6.00-$7.99") return p.price >= 6 && p.price < 8;
        return p.price >= 8 && p.price <= 9.3;
      });
    }
    if (search.trim()) {
      const query = search.toLowerCase();
      const queryTokens = query.split(/[^a-z0-9]+/).filter((token) => token.length >= 2);
      list = list
        .map((product) => {
          const score = scoreSearchMatch(product, query, queryTokens);
          if (score > 0) searchScores.set(product.id, score);
          return { product, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.product);
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
    if (selectedTypes.length > 0) {
      list = list.filter((p) => {
        const types = inferProductTypes(p);
        return selectedTypes.some((type) => types.includes(type));
      });
    }
    if (selectedOccasions.length > 0) {
      list = list.filter((p) => {
        const occasions = p.attributes?.occasions ?? [];
        return selectedOccasions.some((occasion) => occasions.includes(occasion));
      });
    }
    if (selectedFabrics.length > 0) {
      list = list.filter((p) => {
        const fabrics = p.attributes?.fabrics ?? [];
        return selectedFabrics.some((fabric) => fabrics.includes(fabric));
      });
    }
    if (coverage !== "All") {
      list = list.filter((p) => (p.attributes?.coverage ?? "Opaque") === coverage);
    }

    if (sort === "featured") {
      list = [...list].sort((a, b) => {
        const score = (p: (typeof list)[number]) => {
          let value = 0;
          const badge = p.badge?.toLowerCase() ?? "";
          if (rankStrategy === "merch") {
            if (badge.includes("best")) value += 30;
            if (badge.includes("new")) value += 20;
            if (badge.includes("low stock")) value += 12;
            if (p.price <= 20) value += 4;
          } else {
            if (badge.includes("best")) value += 25;
            if (badge.includes("new")) value += 12;
            if (badge.includes("low stock")) value += 8;
            if (personalizationEnabled) {
              if (recentIds.has(p.id)) value += 18;
              if (recentBrands.has(p.brand)) value += 10;
              const tokens = p.name
                .toLowerCase()
                .split(/[^a-z0-9]+/)
                .filter((token) => token.length >= 4);
              const tokenMatches = tokens.filter((token) => recentNameTokens.has(token)).length;
              value += Math.min(12, tokenMatches * 3);
            }
            if (p.price <= 20) value += 3;
          }
          value += Math.min(60, searchScores.get(p.id) ?? 0);
          return value;
        };

        return score(b) - score(a);
      });
    }

    if (sort === "newest") {
      list = [...list].sort((a, b) => b.id.localeCompare(a.id));
    }
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [
    collection,
    price,
    sort,
    rankStrategy,
    search,
    selectedSizes,
    selectedColors,
    selectedBadges,
    selectedTypes,
    selectedOccasions,
    selectedFabrics,
    coverage,
    products,
    recentIds,
    recentBrands,
    recentNameTokens,
    personalizationEnabled,
  ]);

  useEffect(() => {
    setMaxVisible(16);
  }, [
    collection,
    price,
    sort,
    rankStrategy,
    search,
    selectedSizes,
    selectedColors,
    selectedBadges,
    selectedTypes,
    selectedOccasions,
    selectedFabrics,
    coverage,
  ]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setMaxVisible((current) => (current < filtered.length ? current + 16 : current));
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [filtered.length]);

  const visibleProducts = filtered.slice(0, maxVisible);
  const hasMore = visibleProducts.length < filtered.length;

  const activeFilterChips = [
    collection !== "All" ? `Collection: ${collection}` : null,
    price !== "All" ? `Price: ${price}` : null,
    ...selectedSizes.map((size) => `Size: ${size}`),
    ...selectedColors.map((color) => `Color: ${color}`),
    ...selectedBadges.map((badge) => `Tag: ${badge}`),
    ...selectedTypes.map((type) => `Type: ${type}`),
    ...selectedOccasions.map((occasion) => `Occasion: ${occasion}`),
    ...selectedFabrics.map((fabric) => `Fabric: ${fabric}`),
    coverage !== "All" ? `Coverage: ${coverage}` : null,
  ].filter(Boolean) as string[];

  const quickCategories = requestedProductTypes;
  const quickCategoryLabels: Record<ProductTypeFilter, string> = {
    "Night Wear": "Night Wear",
    "Bra & Pant": "Bra & Pant",
    "Sexy Lingerie": "Lace",
    "Sexy Night Wear": "After Dark",
  };
  const trendTracks = ["Most Wanted", "Price Drop", "New In 24h", "Top Rated", "Curve Picks"];

  return (
    <section className="mx-auto max-w-375 px-4 md:px-6 pt-12 pb-24">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Home</span>
        <span>/</span>
        <span>Underwear &amp; Sleepwear</span>
        <span>/</span>
        <span className="font-medium text-foreground">Women Sexy Lingerie &amp; Costumes</span>
      </div>

      <div className="rounded-2xl border border-[#ffc9d2] bg-linear-to-r from-[#fff5f7] via-[#ffeef2] to-[#ffe2ea] px-5 py-4 text-[#c9123a] text-sm font-medium">
        Flash Sale: up to 53% OFF lingerie picks + extra offers on multi-item carts.
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-border bg-white p-5 md:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Top Category
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
            Women Sexy Lingerie & Costumes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Discovery-first feed with quick buy, ranking boosts and trend-led filters.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSelectedTypes([item]);
                  setSearch(quickCategoryLabels[item]);
                }}
                className="rounded-full border border-border bg-[#f8f8f8] px-3 py-1.5 text-xs font-medium hover:border-foreground/30"
              >
                {quickCategoryLabels[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-[#ffc9d2] bg-[#fff0f2] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#c9123a]">
              Today only
            </div>
            <div className="mt-1 text-2xl font-bold text-[#1b1b1b]">Extra 15% Off</div>
            <div className="mt-1 text-sm text-[#a40d2f]">Use code WET15 in checkout.</div>
          </div>
          <div className="rounded-2xl border border-border bg-white px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Trust & Service
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-[#f7f7f7] px-2 py-1.5">Free returns</span>
              <span className="rounded-md bg-[#f7f7f7] px-2 py-1.5">Secure checkout</span>
              <span className="rounded-md bg-[#f7f7f7] px-2 py-1.5">Fast dispatch</span>
              <span className="rounded-md bg-[#f7f7f7] px-2 py-1.5">Top-rated picks</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {trendTracks.map((track) => (
          <button
            key={track}
            type="button"
            onClick={() => {
              if (track === "Price Drop") setSort("low");
              if (track === "New In 24h") setSort("newest");
              if (track === "Most Wanted") setRankStrategy("personalized");
              if (track === "Top Rated") setRankStrategy("merch");
            }}
            className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:border-foreground/40"
          >
            {track}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-md">
        <input
          type="text"
          placeholder="Search lingerie, babydolls, mesh, lace..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const topSuggestion = searchSuggestions[0];
            if (!topSuggestion) return;
            if (search.trim().toLowerCase() === topSuggestion.toLowerCase()) return;
            e.preventDefault();
            setSearch(topSuggestion);
            navigate({
              replace: true,
              search: (prev) => ({
                ...prev,
                q: topSuggestion,
              }),
            });
          }}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
          aria-label="Search products"
        />
        {searchSuggestions.length > 0 && search.trim().length >= 3 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Did you mean:</span>
            {topSuggestion && (
              <button
                type="button"
                onClick={() => {
                  setSearch(topSuggestion);
                  navigate({
                    replace: true,
                    search: (prev) => ({
                      ...prev,
                      q: topSuggestion,
                    }),
                  });
                }}
                className="rounded-full border border-foreground px-2.5 py-1 text-xs font-semibold"
              >
                Use best match
              </button>
            )}
            {searchSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setSearch(suggestion);
                  navigate({
                    replace: true,
                    search: (prev) => ({
                      ...prev,
                      q: suggestion,
                    }),
                  });
                }}
                className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-foreground/40"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-border bg-white p-3">
        <button
          type="button"
          onClick={() => setSort("featured")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${sort === "featured" ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/40"}`}
        >
          Popular now
        </button>
        <button
          type="button"
          onClick={() => setSort("newest")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${sort === "newest" ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/40"}`}
        >
          New arrivals
        </button>
        <button
          type="button"
          onClick={() => setSort("low")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${sort === "low" ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/40"}`}
        >
          Lowest price
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedOccasions(["Party"]);
            setCoverage("Sheer");
            setSort("featured");
          }}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-foreground/40"
        >
          Party Night
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedOccasions(["Romantic"]);
            setSelectedFabrics(["Lace"]);
            setSort("featured");
          }}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-foreground/40"
        >
          Romantic Lace
        </button>
        <button
          type="button"
          onClick={() => {
            setCoverage("Sheer");
            setSelectedFabrics(["Mesh"]);
            setSort("featured");
          }}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-foreground/40"
        >
          Sheer Looks
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedBadges(["New"]);
            setSort("newest");
          }}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-foreground/40"
        >
          New In
        </button>
      </div>

      {recentlyViewed.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Continue Shopping
            </h2>
            <span className="text-xs text-muted-foreground">Based on your recent views</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {recentlyViewed.map((p) => (
              <ProductCard
                key={`recent-${p.id}`}
                p={p}
                clean
                recommendationReason="Continue where you left off"
                onClick={() => trackRecommendationClick("shop-continue-shopping", p.id)}
              />
            ))}
          </div>
        </div>
      )}

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
            availableTypes={availableTypes}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
            availableOccasions={availableOccasions}
            selectedOccasions={selectedOccasions}
            setSelectedOccasions={setSelectedOccasions}
            availableFabrics={availableFabrics}
            selectedFabrics={selectedFabrics}
            setSelectedFabrics={setSelectedFabrics}
            coverage={coverage}
            setCoverage={setCoverage}
            clearAllFacets={clearAllFacets}
          />
        </aside>

        <div>
          <div className="sticky top-16 z-10 mb-3 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Drawer open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs lg:hidden"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Filters
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[85vh] overflow-y-auto px-4 pb-4">
                    <DrawerHeader className="px-0">
                      <DrawerTitle>Filter & Refine</DrawerTitle>
                      <DrawerDescription>
                        Find your fit by size, color, price, and style.
                      </DrawerDescription>
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
                      availableTypes={availableTypes}
                      selectedTypes={selectedTypes}
                      setSelectedTypes={setSelectedTypes}
                      availableOccasions={availableOccasions}
                      selectedOccasions={selectedOccasions}
                      setSelectedOccasions={setSelectedOccasions}
                      availableFabrics={availableFabrics}
                      selectedFabrics={selectedFabrics}
                      setSelectedFabrics={setSelectedFabrics}
                      coverage={coverage}
                      setCoverage={setCoverage}
                      clearAllFacets={clearAllFacets}
                      onDone={() => setMobileFiltersOpen(false)}
                    />
                  </DrawerContent>
                </Drawer>
                <span className="font-bold">{filtered.length}</span> products
                <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[11px] text-muted-foreground">
                  Live ranking
                </span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={togglePersonalization}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold ${personalizationEnabled ? "border-foreground bg-foreground text-background" : "border-border"}`}
                >
                  Personalization {personalizationEnabled ? "On" : "Off"}
                </button>
                <label className="hidden text-xs text-muted-foreground md:inline">Sort</label>
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
                <label className="hidden text-xs text-muted-foreground md:inline">Rank</label>
                <select
                  value={rankStrategy}
                  onChange={(e) => setRankStrategy(e.target.value as RankStrategy)}
                  aria-label="Ranking strategy"
                  title="Ranking strategy"
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:border-foreground/40"
                >
                  <option value="personalized">Personalized</option>
                  <option value="merch">Merch Boost</option>
                </select>
              </div>
            </div>
            {activeFilterChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
            {visibleProducts.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                Nothing matches these filters.
              </div>
            ) : (
              visibleProducts.map((p) => <ProductCard key={p.id} p={p} clean />)
            )}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center" ref={loadMoreRef}>
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
