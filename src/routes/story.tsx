import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Our Story | Wet Lace" },
      {
        name: "description",
        content:
          "Wet Lace is a Harare-based lingerie house bringing considered pieces in lace, silk and mesh to women across Zimbabwe and the region.",
      },
      { property: "og:title", content: "Our Story | Wet Lace" },
      {
        property: "og:description",
        content:
          "A Harare lingerie house. Handpicked seasonal edits. For the ones who don't behave.",
      },
    ],
  }),
  component: Story,
});

// Swap these paths once you have editorial photography of your own.
// Defaults reuse the homepage fallback shot so the page renders day one.
const HERO_IMAGE = "/pexels-foundertips-5218948.jpg";
const CRAFT_IMAGE = "/pexels-foundertips-5218948.jpg";

function Story() {
  return (
    <>
      {/* HERO — atmospheric, almost no copy */}
      <section className="relative w-full bg-black">
        <div className="relative h-[60vh] min-h-[420px] overflow-hidden md:h-[78vh]">
          <img
            src={HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover object-center opacity-85"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-black/60" />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
              <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/70">
                Our Story
              </span>
              <h1 className="mt-4 max-w-3xl text-5xl leading-[1.02] text-white md:text-7xl">
                For the ones who don't behave.
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER NOTE — single column, generous whitespace */}
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="text-center">
          <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
            A Note From The Founder
          </span>
          <h2 className="mt-5 text-3xl leading-tight md:text-4xl">
            We started Wet Lace because the lingerie we wanted wasn't easy to find in Harare.
          </h2>
        </div>
        <div className="mt-10 space-y-6 text-base leading-relaxed text-foreground/80 md:text-lg">
          <p>
            For too long, women here have had to compromise, settling for what's on the shelf or
            waiting weeks for a parcel to arrive from abroad. We saw an opening: bring the pieces
            women actually want to their doorstep, fast, and with the care they deserve.
          </p>
          <p>
            Every edit on our site is handpicked. We don't dump catalogues. We choose pieces we'd
            wear ourselves, pieces with a story: a stitch of lace, a fall of silk, a colour that
            holds its own under low light.
          </p>
          <p className="font-display text-xl italic md:text-2xl">
            "Lingerie shouldn't be a compromise. It should feel like a small, private rebellion."
          </p>
        </div>
      </section>

      {/* VALUES — three columns, restrained */}
      <section className="border-y border-border/70 bg-[#fafafa]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="text-center">
            <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
              What We Stand For
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl">Three quiet promises</h2>
          </div>
          <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
            {[
              {
                title: "Considered",
                body: "We handpick every piece from each season. No bulk drops, no padding the catalogue. If it's on the site, it earned its place.",
              },
              {
                title: "Crafted",
                body: "Fine lace, silk, mesh, and stretch fabrics chosen for how they sit on the body. Quality you feel the first time you put it on.",
              },
              {
                title: "Confident",
                body: "Sizes for every body. 30-day exchanges, no questions. Delivery 2–10 days across Harare and major cities.",
              },
            ].map((value) => (
              <div key={value.title} className="text-center md:text-left">
                <h3 className="text-2xl">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {value.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CRAFT — image left, copy right */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div className="aspect-3/4 overflow-hidden rounded-sm bg-neutral-100">
            <img src={CRAFT_IMAGE} alt="" className="h-full w-full object-cover object-center" />
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
              The Process
            </span>
            <h2 className="mt-4 text-3xl leading-tight md:text-4xl">
              From the workrooms to your wardrobe.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-foreground/80">
              <p>
                We source from established workrooms in Guangzhou, Shantou and Istanbul. The same
                workrooms supplying the brands you already know. The difference is what we choose,
                what we reject, and the price we land at on the other side.
              </p>
              <p>
                Each piece is checked before it ships. We handle returns and exchanges directly,
                from Harare. No offshore service desk, no week-long waits.
              </p>
            </div>
            <Link
              to="/shop"
              className="mt-10 inline-flex border border-foreground px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:bg-foreground hover:text-background"
            >
              Shop the edit
            </Link>
          </div>
        </div>
      </section>

      {/* CLOSING — wordmark + tagline */}
      <section className="border-t border-border/70 bg-foreground py-24 text-background">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <div className="text-base font-bold uppercase tracking-[0.32em]">Wet Lace</div>
          <p className="mt-5 text-2xl leading-snug md:text-3xl">
            <span className="font-display italic">Considered lingerie.</span> Based in Harare,
            shipped across the region.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/shop"
              className="inline-flex border border-background bg-background px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-transparent hover:text-background"
            >
              Shop Now
            </Link>
            <Link
              to="/contact"
              className="inline-flex border border-background px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:bg-background hover:text-foreground"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
