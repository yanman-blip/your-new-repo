import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About - Joy's Closet" },
      { name: "description", content: "Joy's Closet is Harare's boutique for premium lingerie, sleepwear and lounge." },
      { property: "og:title", content: "About Joy's Closet" },
      { property: "og:description", content: "Based in Harare, Zimbabwe. Quality lingerie for every woman." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Our story</span>
      <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tight">
        Harare's <span className="italic font-light">lingerie boutique.</span>
      </h1>
      <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
        Joy's Closet is a lingerie and sleepwear boutique based in Harare, Zimbabwe. We started with one goal: to make quality lingerie and lounge accessible to every woman in Zimbabwe. We stock a range of styles, from everyday essentials to special-occasion pieces, so you always find what you need.
      </p>
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {[
          { h: "Quality", b: "We only stock pieces we believe in: comfortable, well-made, and worth every cent." },
          { h: "Local", b: "Based in Harare. We know our customers and we're here when you need us." },
          { h: "For every woman", b: "Wide range of sizes and styles. Lingerie that makes you feel good, every day." },
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
