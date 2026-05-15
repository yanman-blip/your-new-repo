import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { ArrowRight, Truck, Heart, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useProducts } from "@/lib/use-products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Joy's Closet - Lingerie, Sleepwear & Lounge | Harare, Zimbabwe" },
      {
        name: "description",
        content:
          "Joy's Closet is Harare's destination for premium lingerie, sleepwear and lounge. Quality pieces for every body.",
      },
      { property: "og:title", content: "Joy's Closet - Harare's Lingerie Boutique" },
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
              Soft things,
              <br />
              <span className="font-light italic">worn close.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg opacity-70">
              Joy's Closet is your go-to boutique for lingerie, sleepwear and lounge. Quality pieces for every occasion, right here in Harare.
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
          {products.map((p) => (
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
              Joy's Closet is based in Harare, Zimbabwe. We stock quality lingerie, sleepwear and lounge for women who want to feel great every day.
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
                <img src={img} alt="Joy's Closet lookbook" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
