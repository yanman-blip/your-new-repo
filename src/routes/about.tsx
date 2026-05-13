import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — LOFTIE" },
      { name: "description", content: "LOFTIE is a Paris-based lingerie atelier making quietly luxurious pieces in Portugal — slowly, ethically, and beautifully." },
      { property: "og:title", content: "About LOFTIE" },
      { property: "og:description", content: "Designed in Paris. Made ethically in Portugal." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Our story</span>
      <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tight">
        Lingerie made the <span className="italic font-light">slow way.</span>
      </h1>
      <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
        LOFTIE began in a Parisian apartment in 2021 with a single question: why does most lingerie still feel like a compromise?
        We set out to make pieces that disappear when you wear them — soft enough to sleep in, beautiful enough to live in.
        Every LOFTIE garment is cut, sewn and hand-finished in a small family-run atelier outside Porto, using OEKO-TEX certified
        French lace, 22-momme mulberry silk and long-staple Peruvian Pima cotton.
      </p>
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {[
          { h: "Considered", b: "Six pieces, refined for years. We'd rather make less, and make it perfect." },
          { h: "Honest", b: "Direct from our atelier in Porto to your door — no middlemen, no markups." },
          { h: "Soft on skin, soft on earth", b: "OEKO-TEX certified fabrics, biodegradable mailers, lifetime mending." },
        ].map((c) => (
          <div key={c.h} className="rounded-2xl bg-surface p-6">
            <div className="font-semibold tracking-tight">{c.h}</div>
            <p className="mt-2 text-sm text-muted-foreground">{c.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
