import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Orbit" },
      { name: "description", content: "Orbit brings the world's best flagship phones into one beautifully curated store." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">About Orbit</span>
      <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tight">
        One store. Every flagship.
      </h1>
      <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
        Orbit was founded on a simple idea: the world's best phones shouldn't live in walled gardens.
        We curate, certify and ship every flagship — Pro, Foldable, Air and Mini — with the same care and obsession
        you'd expect from the brands themselves.
      </p>
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {[
          { h: "Curated", b: "Only the phones we'd buy ourselves. No filler." },
          { h: "Certified", b: "Every device tested across 47 quality checkpoints." },
          { h: "Connected", b: "Lifetime support, software updates and easy trade-in." },
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
