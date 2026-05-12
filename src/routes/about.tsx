import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Kingpin Electronics" },
      { name: "description", content: "Kingpin Electronics is a certified iPhone and Samsung retailer trusted by thousands of customers." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">About Kingpin</span>
      <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tight">
        The certified home of iPhone & Galaxy.
      </h1>
      <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
        Kingpin Electronics is an authorized retailer for both Apple and Samsung. Every phone we sell is genuine,
        sealed, and covered by full manufacturer warranty — backed by our own service team and a 30-day return promise.
      </p>
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {[
          { h: "Authorized", b: "Direct partnerships with Apple and Samsung. No grey-market devices, ever." },
          { h: "Certified", b: "Every device passes 47 quality checks before it ships from our warehouse." },
          { h: "Supported", b: "Real humans, real warranty service. Lifetime trade-in on every phone." },
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
