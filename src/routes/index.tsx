import { createFileRoute, Link } from "@tanstack/react-router";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import heroPhone from "@/assets/hero-phone.jpg";
import { ArrowRight, Truck, ShieldCheck, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orbit — Flagship phones, all in one store" },
      { name: "description", content: "Pro, Foldable, Air, Mini. The best smartphones from every world, in one elegant storefront." },
    ],
  }),
  component: Home,
});

function Home() {
  const [hero, ...rest] = products;
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[oklch(0.12_0.02_265)] text-white">
        <div className="mx-auto max-w-7xl px-6 pt-20 md:pt-28 pb-10 md:pb-16">
          <div className="max-w-3xl">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">New · Orbit Pro 17</span>
            <h1 className="mt-4 text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.95]">
              Titanium.<br />Cinematic.<br />
              <span className="bg-gradient-to-r from-[oklch(0.7_0.2_280)] via-[oklch(0.75_0.18_220)] to-[oklch(0.85_0.15_180)] bg-clip-text text-transparent">
                Unstoppable.
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-xl">
              The flagship reimagined. A4-grade titanium, the all-new A19 chip, and the most cinematic display ever on a phone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="px-6 py-3 rounded-full bg-white text-[oklch(0.12_0.02_265)] text-sm font-medium hover:bg-white/90 transition">
                Buy from $1,299
              </Link>
              <Link to="/shop" className="px-6 py-3 rounded-full border border-white/20 text-sm font-medium hover:bg-white/10 transition inline-flex items-center gap-2">
                Watch the film <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="relative">
          <img
            src={heroPhone}
            alt="Orbit Pro 17 floating in space"
            width={1920}
            height={1080}
            className="w-full max-h-[70vh] object-contain"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[oklch(0.12_0.02_265)]" />
        </div>
      </section>

      {/* Marquee strip */}
      <section className="border-y border-border/50 bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-6 text-sm text-muted-foreground">
          {[
            { Icon: Truck, t: "Free 2-day shipping" },
            { Icon: RefreshCw, t: "Trade in any phone" },
            { Icon: ShieldCheck, t: "2-year warranty" },
            { Icon: ArrowRight, t: "Pay over 24 months 0% APR" },
          ].map(({ Icon, t }) => (
            <div key={t} className="flex items-center gap-2"><Icon className="w-4 h-4" /> {t}</div>
          ))}
        </div>
      </section>

      {/* Featured grid */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Meet the lineup</h2>
            <p className="mt-2 text-muted-foreground">Pick the phone that matches your story.</p>
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
        <div className="rounded-3xl bg-gradient-to-br from-foreground to-[oklch(0.25_0.03_265)] text-background p-10 md:p-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] opacity-60">Trade-in</span>
            <h3 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight">
              Get up to <span className="text-brand">$800</span> when you trade in.
            </h3>
            <p className="mt-4 opacity-70 max-w-md">
              Send us your old phone. We'll send you a new one. It's that simple — and good for the planet.
            </p>
            <Link to="/shop" className="mt-6 inline-flex px-6 py-3 rounded-full bg-background text-foreground text-sm font-medium">
              Estimate my trade
            </Link>
          </div>
          <div className="opacity-90">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[{n:"40M+",l:"Phones sold"},{n:"180",l:"Countries"},{n:"4.9★",l:"Avg rating"}].map(s=>(
                <div key={s.l} className="rounded-2xl bg-white/5 p-6">
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
