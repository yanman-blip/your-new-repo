import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { ArrowRight, Truck, Heart, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useProducts } from "@/lib/use-products";

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
  const featuredId = "sleeveless-sexy-bandage-dress";
  const hero = products.find((product) => product.id === featuredId) ?? products[0];
  const newDrops = products.filter((p) => p.badge?.toLowerCase() === "new").slice(0, 8);
  const trending = products.slice(0, 8);
  const salePicks = products.slice(8, 14);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const heroGallery = hero?.gallery && hero.gallery.length > 0 ? hero.gallery : [hero?.image || ""];

  useEffect(() => {
    if (heroGallery.length <= 1) return;
    const interval = window.setInterval(() => {
      setHeroImageIndex((current) => (current + 1) % heroGallery.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-[oklch(0.95_0.02_30)] text-[oklch(0.18_0.02_30)]">
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-10 md:pt-28 md:pb-16">
          <div className="max-w-3xl">
            <span className="text-xs uppercase tracking-[0.3em] opacity-60">Harare, Zimbabwe</span>
            <h1 className="mt-4 text-5xl leading-[0.95] font-semibold tracking-tight md:text-7xl lg:text-8xl">
              For the ones who
              <br />
              <span className="font-light italic">don't behave.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg opacity-70">
              WET LACE, lingerie, silk and lace for the women who wear what they want. Made in Harare, worn everywhere.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90"
              >
                Shop the collection
              </Link>
            </div>
          </div>
        </div>

        <div className="relative">
          <img
            src={heroGallery[heroImageIndex]}
            alt={hero.name}
            width={1920}
            height={1080}
            className="max-h-[76vh] w-full bg-[oklch(0.95_0.02_30)] object-contain object-center"
          />

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/75 px-3 py-1.5">
            {heroGallery.map((img, i) => (
              <button
                key={img}
                onClick={() => setHeroImageIndex(i)}
                className={`h-2 w-2 rounded-full transition ${heroImageIndex === i ? "bg-foreground" : "bg-foreground/35 hover:bg-foreground/60"}`}
                aria-label={`Show hero image ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-6 text-sm text-muted-foreground">
          {[
            { Icon: Truck, t: "Delivery across Harare" },
            { Icon: RefreshCw, t: "30-day exchanges" },
            { Icon: Heart, t: "Based in Harare, Zimbabwe" },
            { Icon: Sparkles, t: "Discreet packaging" },
          ].map(({ Icon, t }) => (
            <div key={t} className="flex items-center gap-2">
              <Icon className="h-4 w-4" /> {t}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#f2d8c7] bg-[#fff4ec] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-[#b55f2f]">Hot Right Now</div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Underwear & Sleepwear</h3>
            <p className="mt-2 text-sm text-[#8f5f44]">Top-ranked lace and mesh picks with fast local delivery.</p>
            <Link to="/shop" className="mt-4 inline-flex text-sm font-medium text-[#b55f2f] hover:underline">Explore trending</Link>
          </div>
          <div className="rounded-2xl border border-[#f1e4d2] bg-[#fff9f2] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-[#8a6649]">Daily Deals</div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Up to 53% Off</h3>
            <p className="mt-2 text-sm text-[#84634a]">Limited-time markdowns on bestselling lingerie sets.</p>
            <Link to="/shop" search={{ sort: "low" }} className="mt-4 inline-flex text-sm font-medium text-[#8a6649] hover:underline">Shop deals</Link>
          </div>
          <div className="rounded-2xl border border-[#e6dff3] bg-[#f5f2ff] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-[#5f4fa5]">New In</div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Fresh Drops</h3>
            <p className="mt-2 text-sm text-[#5d528f]">New arrivals added regularly from your latest catalog uploads.</p>
            <Link to="/shop" search={{ sort: "newest" }} className="mt-4 inline-flex text-sm font-medium text-[#5f4fa5] hover:underline">View new arrivals</Link>
          </div>
        </div>
      </section>

      {newDrops.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-10">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">New Drops</h2>
              <p className="mt-2 text-sm text-muted-foreground">Fresh catalog updates inspired by top-performing styles.</p>
            </div>
            <Link to="/shop" search={{ sort: "newest" }} className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex">See all</Link>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {newDrops.map((p) => (
              <ProductCard key={p.id} p={p} clean />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Our collection</h2>
            <p className="mt-2 text-muted-foreground">Handpicked styles for every mood and every body.</p>
          </div>
          <Link to="/shop" className="hidden items-center gap-2 text-sm transition-colors hover:text-brand md:inline-flex">
            Shop all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {trending.map((p) => (
            <ProductCard key={p.id} p={p} clean />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Deal Zone</h2>
            <p className="mt-2 text-sm text-muted-foreground">High-conversion picks with promo-driven pricing cues.</p>
          </div>
          <Link to="/shop" search={{ sort: "low" }} className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex">More deals</Link>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {salePicks.map((p) => (
            <ProductCard key={p.id} p={p} clean />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid items-center gap-8 rounded-3xl bg-linear-to-br from-[oklch(0.92_0.04_25)] to-[oklch(0.86_0.03_30)] p-10 text-[oklch(0.2_0.03_30)] md:grid-cols-2 md:p-16">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] opacity-60">About us</span>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Harare's <span className="font-light italic">lingerie boutique.</span>
            </h3>
            <p className="mt-4 max-w-md opacity-70">
              WET LACE is based in Harare, Zimbabwe. We stock quality lingerie, sleepwear and lounge for women who want to feel great every day.
            </p>
            <Link
              to="/about"
              className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
            >
              Read our story
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {heroGallery.slice(0, 4).map((img, i) => (
              <div key={img} className={`overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 h-52" : "h-36"}`}>
                <img src={img} alt="WET LACE lookbook" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
