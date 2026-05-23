import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Ruler } from "lucide-react";

export const Route = createFileRoute("/size-guide")({
  head: () => ({
    meta: [
      { title: "Size Guide - WET LACE" },
      {
        name: "description",
        content:
          "Find your WET LACE size with quick fit notes for bras, sets, nightwear and stretch styles.",
      },
    ],
  }),
  component: SizeGuidePage,
});

function SizeGuidePage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0f2] px-3 py-1 text-xs font-semibold text-[#c9123a]">
        <Ruler className="h-3.5 w-3.5" /> FIT HELP
      </div>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
        Find the right fit faster.
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
        Use these quick rules before you buy: stretch sets are more forgiving, wired bras need a
        closer band fit, and nightwear is best chosen by the silhouette you want rather than the
        tightest possible size.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Bras",
            body: "Choose your usual band size first. If you want more lift, stay true to size. If you want a softer fit, size up in cup-driven silhouettes.",
          },
          {
            title: "Bra & Pant Sets",
            body: "Best when you want a matched look without styling effort. If a set runs fitted and you are between sizes, size up.",
          },
          {
            title: "Night Wear",
            body: "Babydolls and dresses can be worn closer to the body or slightly loose. Pick based on the mood and drape you want.",
          },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border border-border bg-white p-5">
            <div className="font-semibold">{card.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-[#fafafa]">
        <div className="grid grid-cols-3 border-b border-border bg-white text-sm font-semibold">
          <div className="px-4 py-3">Size</div>
          <div className="px-4 py-3">Bust</div>
          <div className="px-4 py-3">Hips</div>
        </div>
        {[
          ["S", "80-86 cm", "86-92 cm"],
          ["M", "86-92 cm", "92-98 cm"],
          ["L", "92-98 cm", "98-104 cm"],
          ["XL", "98-104 cm", "104-110 cm"],
        ].map(([size, bust, hips]) => (
          <div
            key={size}
            className="grid grid-cols-3 border-b border-border/70 text-sm last:border-b-0"
          >
            <div className="px-4 py-3 font-medium">{size}</div>
            <div className="px-4 py-3 text-muted-foreground">{bust}</div>
            <div className="px-4 py-3 text-muted-foreground">{hips}</div>
          </div>
        ))}
      </div>

      <Link
        to="/contact"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium hover:text-foreground"
      >
        Still unsure? Ask for sizing help <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
