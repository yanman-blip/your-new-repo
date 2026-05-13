import { createFileRoute, Link } from "@tanstack/react-router";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import lingerieHero from "@/assets/lingerie-hero.jpg";
import { ArrowRight, Truck, Heart, RefreshCw, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LOFTIE — Quietly luxurious lingerie, sleepwear & lounge" },
      { name: "description", content: "LOFTIE makes featherlight French lace, mulberry silk slips and Pima cotton essentials. Designed in Paris, made ethically in Portugal." },
      { property: "og:title", content: "LOFTIE — Quietly luxurious lingerie" },
      { property: "og:description", content: "Featherlight lace, mulberry silk, and everyday softness. Made ethically in Portugal." },
    ],
  }),
  component: Home,
});

function Home() {
  const [hero, ...rest] = products;
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[oklch(0.95_0.02_30)] text-[oklch(0.18_0.02_30)]">
        <div className="mx-auto max-w-7xl px-6 pt-20 md:pt-28 pb-10 md:pb-16">
          <div className="max-w-3xl">
            <span className="text-xs uppercase tracking-[0.3em] opacity-60">Maison · Paris / Porto</span>
            <h1 className="mt-4 text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.95]">
              Soft things,<br />
              <span className="italic font-light">worn close.</span>
            </h1>
            <p className="mt-6 text-lg opacity-70 max-w-xl">
              LOFTIE is lingerie, sleepwear and lounge made the slow way — French lace, mulberry silk, heritage Pima cotton — designed to feel like nothing at all.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition">
                Shop the collection
              </Link>
              <Link to="/product/$id" params={{ id: "noir-silk-slip" }} className="px-6 py-3 rounded-full border border-foreground/20 text-sm font-medium hover:bg-foreground/5 transition inline-flex items-center gap-2">
                Discover the Silk slip <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="relative">
          <img
            src={lingerieHero}
            alt="Folded blush and ivory silk lingerie with lace trim"
            width={1920}
            height={1080}
            className="w-full max-h-[70vh] object-cover"
          />
        </div>
      </section>

      {/* Marquee strip */}
      <section className="border-y border-border/50 bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-6 text-sm text-muted-foreground">
          {[
            { Icon: Truck, t: "Complimentary shipping over $150" },
            { Icon: RefreshCw, t: "30-day exchanges" },
            { Icon: Heart, t: "Made ethically in Portugal" },
            { Icon: Sparkles, t: "Discreet packaging" },
          ].map(({ Icon, t }) => (
            <div key={t} className="flex items-center gap-2"><Icon className="w-4 h-4" /> {t}</div>
          ))}
        </div>
      </section>

      {/* Featured grid */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">The new edit</h2>
            <p className="mt-2 text-muted-foreground">Six pieces. Every one made to live close to the skin.</p>
          </div>
          <Link to="/shop" className="hidden md:inline-flex items-center gap-2 text-sm hover:text-brand transition-colors">
            Shop all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2"><ProductCard p={hero} large /></div>
          {rest.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* Banner */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-[oklch(0.92_0.04_25)] to-[oklch(0.86_0.03_30)] text-[oklch(0.2_0.03_30)] p-10 md:p-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] opacity-60">Our atelier</span>
            <h3 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
              Cut, sewn and finished <span className="italic font-light">by hand.</span>
            </h3>
            <p className="mt-4 opacity-70 max-w-md">
              Every LOFTIE piece is made in a small family-run atelier outside Porto. No middlemen, no waste, no compromises on fabric.
            </p>
            <Link to="/about" className="mt-6 inline-flex px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium">
              Read our story
            </Link>
          </div>
          <div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[{n:"22mm",l:"Mulberry silk"},{n:"100%",l:"OEKO-TEX certified"},{n:"4.9★",l:"15k reviews"}].map(s=>(
                <div key={s.l} className="rounded-2xl bg-foreground/5 p-6">
                  <div className="text-2xl md:text-3xl font-semibold">{s.n}</div>
                  <div className="text-xs opacity-60 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
