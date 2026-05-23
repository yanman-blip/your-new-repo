import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Truck } from "lucide-react";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping - WET LACE" },
      {
        name: "description",
        content: "WET LACE shipping, local delivery, collection and dispatch expectations.",
      },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-semibold text-[#1258c9]">
        <Truck className="h-3.5 w-3.5" /> DELIVERY INFO
      </div>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
        Shipping and collection.
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
        We dispatch quickly, confirm payment before release where needed, and keep local delivery
        simple for Harare shoppers.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Harare delivery",
            body: "Local deliveries are prioritised first and usually move fastest once payment is confirmed.",
          },
          {
            title: "Collection",
            body: "Choose collection at checkout if you want to skip the delivery fee and collect once your order is ready.",
          },
          {
            title: "Payment proof",
            body: "For EcoCash, InnBucks, Mukuru and bank transfer, upload proof after placing the order so approval can move faster.",
          },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border border-border bg-white p-5">
            <div className="font-semibold">{card.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-[#fafafa] p-6">
        <h2 className="text-xl font-semibold tracking-tight">What to expect</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>Orders are created first, then payment is confirmed where required.</li>
          <li>Cash on delivery remains available for eligible local orders.</li>
          <li>Delivery fees are shown clearly during checkout before you pay.</li>
        </ul>
      </div>

      <Link
        to="/checkout"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium hover:text-foreground"
      >
        Review checkout options <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
