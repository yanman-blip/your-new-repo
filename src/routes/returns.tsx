import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Undo2 } from "lucide-react";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns - WET LACE" },
      {
        name: "description",
        content: "WET LACE returns and exchange expectations for lingerie, sleepwear and lounge.",
      },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#edf8f1] px-3 py-1 text-xs font-semibold text-[#1f7d57]">
        <Undo2 className="h-3.5 w-3.5" /> RETURNS HELP
      </div>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
        Returns and exchanges.
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
        We aim to keep returns simple. If something arrives wrong or the fit is off, contact us
        quickly so we can guide the next step.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Return window",
            body: "Start your return request within 30 days of receiving your order so the team can assess and assist promptly.",
          },
          {
            title: "Condition",
            body: "Items should be unworn, unwashed and returned with original tags and hygiene protections where applicable.",
          },
          {
            title: "Exchanges",
            body: "If you only need a different size or colour, tell us that first so we can resolve it faster than a full return.",
          },
          {
            title: "Support",
            body: "Message the team with your order reference and issue summary so we can confirm the best path for you.",
          },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border border-border bg-white p-5">
            <div className="font-semibold">{card.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>

      <Link
        to="/contact"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium hover:text-foreground"
      >
        Contact support about a return <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
