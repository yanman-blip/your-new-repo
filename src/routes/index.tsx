import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { ArrowRight, Truck, RefreshCw, TicketPercent } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/lib/use-products";
import { useRecentlyViewedProducts } from "@/lib/recently-viewed";
import { usePersonalizationSettings } from "@/lib/personalization";
import { trackRecommendationClick, trackRecommendationImpression } from "@/lib/recommendation-analytics";
import { useHomeMerchandisingSettings } from "@/lib/merchandising-settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WET LACE - Lingerie, Sleepwear & Lounge | Harare, Zimbabwe" },
      {
        name: "description",
        content:
          "WET LACE is Harare's destination for premium lingerie, sleepwear and lounge. Quality pieces for every body.",
      },
      { property: "og:title", content: "WET LACE - Harare's Lingerie Boutique" },
      {
        property: "og:description",
        content: "Premium lingerie, sleepwear and lounge. Based in Harare, Zimbabwe.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const products = useProducts();
  const { settings: merchSettings } = useHomeMerchandisingSettings();
  const recentlyViewed = useRecentlyViewedProducts(8);
  const { enabled: personalizationEnabled, toggle: togglePersonalization } = usePersonalizationSettings();
  const [isClientHydrated, setIsClientHydrated] = useState(false);
  const featuredId = merchSettings.featuredProductId;
  const hero = products.find((product) => product.id === featuredId) ?? products[0];
  const newDrops = products
    .filter((p) => p.badge?.toLowerCase() === "new")
    .slice(0, merchSettings.newDropsCount);
  const trending = products.slice(0, merchSettings.trendingCount);
  const salePicks = products.slice(
    merchSettings.saleStartIndex,
    merchSettings.saleStartIndex + merchSettings.saleCount,
  );
  const categoryShortcuts =
    merchSettings.categoryShortcuts.length > 0
      ? merchSettings.categoryShortcuts
      : ["Lingerie Sets", "Babydolls", "Bodysuits", "Plus Size", "Sleepwear", "Leggings"];
  const safeRecentlyViewed = isClientHydrated ? recentlyViewed : [];

  const pickDistinct = <T extends { id: string }>(
    source: T[],
    count: number,
    used: Set<string>,
  ) => {
    const next: T[] = [];
    for (const item of source) {
      if (used.has(item.id)) continue;
      used.add(item.id);
      next.push(item);
      if (next.length >= count) break;
    }
    return next;
  };

  const recommendedForYou = useMemo(() => {
    if (!isClientHydrated || !personalizationEnabled) return [];
    if (products.length === 0) return [];

    const recentIds = new Set(safeRecentlyViewed.map((product) => product.id));
    const recentBrands = new Set(safeRecentlyViewed.map((product) => product.brand));
    const recentTokens = new Set<string>();

    for (const product of safeRecentlyViewed) {
      for (const token of product.name.toLowerCase().split(/[^a-z0-9]+/)) {
        if (token.length >= 4) recentTokens.add(token);
      }
    }

    return products
      .filter((product) => !recentIds.has(product.id))
      .map((product) => {
        let score = 0;
        if (recentBrands.has(product.brand)) score += 16;
        if (product.badge?.toLowerCase().includes("best")) score += 10;
        if (product.badge?.toLowerCase().includes("new")) score += 8;

        const tokens = product.name.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 4);
        const overlap = tokens.filter((token) => recentTokens.has(token)).length;
        score += Math.min(16, overlap * 4);

        return { product, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((entry) => entry.product);
  }, [products, safeRecentlyViewed, personalizationEnabled, isClientHydrated]);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const heroSlides = useMemo(() => {
    const fallback = "/pexels-foundertips-5218948.jpg";
    const pickImage = (product: typeof hero) =>
      (product?.gallery && product.gallery.length > 0 ? product.gallery[0] : product?.image) ?? fallback;
    const heroProduct = hero;
    const uniqueHeroProducts = products
      .filter((product) => !!product?.image)
      .reduce<typeof products>((acc, product) => {
        if (!acc.some((existing) => existing.id === product.id)) acc.push(product);
        return acc;
      }, [])
      .slice(0, 8);

    const newProduct =
      products.find((p) => p.badge?.toLowerCase() === "new") ?? uniqueHeroProducts[0] ?? heroProduct;
    const bestProduct =
      products.find((p) => p.badge?.toLowerCase().includes("best") && p.id !== newProduct?.id) ??
      uniqueHeroProducts.find((p) => p.id !== newProduct?.id) ??
      heroProduct;
    const saleProduct =
      products
        .slice()
        .sort((a, b) => a.price - b.price)
        .find((p) => p.id !== newProduct?.id && p.id !== bestProduct?.id) ??
      uniqueHeroProducts.find((p) => p.id !== newProduct?.id && p.id !== bestProduct?.id) ??
      heroProduct;

    return [
      {
        tag: "New In",
        heading: "The Lace Edit",
        sub: "Considered new pieces in silk, mesh and fine lace. Handpicked weekly.",
        cta: "Shop New In",
        sortKey: "newest" as const,
        image: pickImage(newProduct),
      },
      {
        tag: "Quietly Iconic",
        heading: "Quietly Iconic",
        sub: "Top-rated pieces from this season's collection.",
        cta: "Shop Best",
        sortKey: "featured" as const,
        image: pickImage(bestProduct),
      },
      {
        tag: "The Sale Edit",
        heading: "Carefully Reduced",
        sub: "A curated selection of pieces, now at gentler prices.",
        cta: "Shop Sale",
        sortKey: "low" as const,
        image: pickImage(saleProduct),
      },
    ];
  }, [products, hero]);

  const sectionItems = useMemo(() => {
    const used = new Set<string>();
    const newDropItems = pickDistinct(
      products.filter((p) => p.badge?.toLowerCase() === "new"),
      merchSettings.newDropsCount,
      used,
    );
    const bestSellerCandidates = [
      ...products.filter((p) => p.badge?.toLowerCase().includes("best")),
      ...products,
    ];
    const bestSellerItems = pickDistinct(bestSellerCandidates, 6, used);
    const saleCandidates = [...products].sort((a, b) => a.price - b.price);
    const saleItems = pickDistinct(saleCandidates, 6, used);

    return {
      newDropItems,
      bestSellerItems,
      saleItems,
    };
  }, [products, merchSettings.newDropsCount]);

  const shortcutSearch: Record<string, { q?: string; types?: string; sort?: string }> = {
    "Lingerie Sets": { types: "Bra & Pant" },
    Babydolls: { q: "babydoll", types: "Night Wear" },
    Bodysuits: { q: "bodysuit" },
    "Plus Size": { q: "plus size" },
    Sleepwear: { types: "Night Wear" },
    Leggings: { q: "leggings" },
  };

  useEffect(() => {
    setIsClientHydrated(true);
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const interval = window.setInterval(() => {
      setHeroImageIndex((current) => (current + 1) % heroSlides.length);
    }, merchSettings.heroRotationMs);

    return () => window.clearInterval(interval);
  }, [heroSlides.length, merchSettings.heroRotationMs]);

  useEffect(() => {
    for (const product of safeRecentlyViewed) {
      trackRecommendationImpression("home-because-you-viewed", product.id);
    }
  }, [safeRecentlyViewed]);

  useEffect(() => {
    for (const product of recommendedForYou) {
      trackRecommendationImpression("home-recommended-for-you", product.id);
    }
  }, [recommendedForYou]);

  return (
    <>
      <section className="relative w-full bg-black">
        <div className="relative h-65 overflow-hidden sm:h-85 md:h-110 lg:h-125">
          {heroSlides.map((slide, i) => (
            <div
              key={slide.tag}
              className={`absolute inset-0 transition-opacity duration-700 ${i === heroImageIndex ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <img
                src={slide.image}
                alt=""
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/35 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
                  <div className="max-w-md text-white">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.28em] text-white/80">
                      {slide.tag}
                    </span>
                    <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
                      {slide.heading}
                    </h1>
                    <p className="mt-3 max-w-sm text-sm opacity-85 md:text-base">
                      {slide.sub}
                    </p>
                    <Link
                      to="/shop"
                      search={{ sort: slide.sortKey }}
                      className="mt-6 inline-flex border border-white px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-black"
                    >
                      {slide.cta}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {heroSlides.map((slide, i) => (
              <button
                key={`dot-${slide.tag}`}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setHeroImageIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === heroImageIndex ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-[#fafafa]">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            <div className="border-l border-border/60 pl-3 md:pl-4">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Truck className="h-3.5 w-3.5" /> Express
              </div>
              <p className="mt-1 text-xs font-medium md:text-sm">2&ndash;10 days delivery</p>
            </div>
            <div className="border-l border-border/60 pl-3 md:pl-4">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" /> Easy returns
              </div>
              <p className="mt-1 text-xs font-medium md:text-sm">30-day exchanges</p>
            </div>
            <div className="border-l border-border/60 pl-3 md:pl-4">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <TicketPercent className="h-3.5 w-3.5" /> Members
              </div>
              <p className="mt-1 text-xs font-medium md:text-sm">Free over $49</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {categoryShortcuts.map((category) => (
              <Link
                key={category}
                to="/shop"
                search={shortcutSearch[category] ?? { q: category.toLowerCase() }}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium hover:border-foreground/40"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{merchSettings.saleRailTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Price drops and top-converting products.</p>
          </div>
          <Link to="/shop" search={{ sort: "low" }} className="hidden items-center gap-2 text-sm hover:text-foreground md:inline-flex">
            View all deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
          {(sectionItems.saleItems.length > 0 ? sectionItems.saleItems : salePicks).slice(0, 6).map((p) => (
            <ProductCard key={`sale-${p.id}`} p={p} clean />
          ))}
        </div>
      </section>

      {sectionItems.newDropItems.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-10">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">New Drops</h2>
              <p className="mt-2 text-sm text-muted-foreground">Fresh catalog updates inspired by top-performing styles.</p>
            </div>
            <Link to="/shop" search={{ sort: "newest" }} className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex">See all</Link>
          </div>
          <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {sectionItems.newDropItems.map((p) => (
              <ProductCard key={p.id} p={p} clean />
            ))}
          </div>
        </section>
      )}

      {recommendedForYou.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-10">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Recommended For You</h2>
              <p className="mt-2 text-sm text-muted-foreground">Personalized by what you viewed and what shoppers buy next.</p>
            </div>
            <Link to="/shop" search={{ sort: "featured", rank: "personalized" }} className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex">See more</Link>
          </div>
          <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {recommendedForYou.map((p) => (
              <ProductCard
                key={`rec-home-${p.id}`}
                p={p}
                clean
                recommendationReason="Picked for your style"
                onClick={() => trackRecommendationClick("home-recommended-for-you", p.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Best Sellers</h2>
            <p className="mt-2 text-sm text-muted-foreground">Most viewed and most added picks this week.</p>
          </div>
          <Link to="/shop" search={{ sort: "featured" }} className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex">View ranking</Link>
        </div>
        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {sectionItems.bestSellerItems.map((p) => (
            <ProductCard key={p.id} p={p} clean />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-[#f7f7f7] p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">TRUSTED CHECKOUT</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Easy ways to pay in Zimbabwe</h3>
              <p className="mt-3 text-sm text-muted-foreground">Pay with EcoCash, ZIPIT, or USD bank transfer. Need help before checkout? Message us on WhatsApp for size or fit advice.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {[
                  "EcoCash",
                  "ZIPIT",
                  "USD Bank Transfer",
                  "Secure Checkout",
                ].map((item) => (
                  <span key={item} className="rounded-full border border-border bg-white px-3 py-1.5 font-medium">
                    {item}
                  </span>
                ))}
              </div>
              <a
                href="https://wa.me/263782853304?text=Hi%20Wet%20Lace%2C%20I%20need%20help%20with%20a%20size%20or%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full border border-[#25d366] bg-[#25d366]/10 px-4 py-2 text-sm font-semibold text-[#128c4a]"
              >
                Chat on WhatsApp
              </a>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">NEWSLETTER</p>
              <h4 className="mt-2 text-xl font-semibold tracking-tight">Get 10% off your first order</h4>
              <p className="mt-2 text-sm text-muted-foreground">Join for drops, restocks, and private sale alerts.</p>
              <form className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm"
                  aria-label="Email address"
                />
                <button type="submit" className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white">
                  Join
                </button>
              </form>
              <div className="mt-5 rounded-xl border border-border bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Customer Love</p>
                <p className="mt-2 text-sm text-foreground">"Beautiful quality and true-to-size fit. Delivery was fast in Harare."</p>
                <p className="mt-1 text-xs text-muted-foreground">4.8/5 average from verified reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
