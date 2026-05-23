import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers3 } from "lucide-react";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track Order - WET LACE" },
      {
        name: "description",
        content: "How to check your WET LACE order status and what each workflow stage means.",
      },
    ],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#f3f1ff] px-3 py-1 text-xs font-semibold text-[#5a40c6]">
        <Layers3 className="h-3.5 w-3.5" /> ORDER STATUS
      </div>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
        Track your order status.
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
        Sign in to view your order list and current status. If your order is waiting on proof or
        confirmation, the status text on your account page will tell you exactly what happens next.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Awaiting proof",
            body: "Your order was created and is waiting for your payment proof upload.",
          },
          {
            title: "Awaiting confirmation",
            body: "Payment was received and the team is confirming the transfer before release.",
          },
          {
            title: "Paid & confirmed",
            body: "Your order is cleared and ready for delivery or collection next steps.",
          },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border border-border bg-white p-5">
            <div className="font-semibold">{card.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/account/orders"
          className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
        >
          View my orders
        </Link>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full border border-black px-5 py-2.5 text-sm font-semibold"
        >
          Sign in first <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
