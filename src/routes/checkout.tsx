import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { Trash2, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — LOFTIE" },
      { name: "description", content: "Review your bag and complete your LOFTIE order securely." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { detailed, subtotal, remove, updateQty, count } = useCart();
  const shipping = subtotal > 0 ? 0 : 0;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shipping + tax;

  if (count === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Your bag is empty</h1>
        <p className="mt-3 text-muted-foreground">Find something soft to slip into.</p>
        <Link to="/shop" className="mt-8 inline-block px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium">
          Shop the collection
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" /> Continue shopping
      </Link>
      <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">Checkout</h1>

      <div className="mt-10 grid lg:grid-cols-[1fr_400px] gap-10">
        <div>
          <ul className="divide-y divide-border border-y border-border">
            {detailed.map((i) => (
              <li key={`${i.productId}-${i.storage}-${i.color}`} className="py-6 flex gap-4">
                <div className="w-24 h-24 rounded-2xl bg-surface overflow-hidden flex-shrink-0">
                  <img src={i.product.image} alt={i.product.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between gap-2">
                    <div>
                      <div className="font-medium">{i.product.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{i.product.brand} · {i.storage} · {i.color}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${i.lineTotal.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">${i.product.price.toLocaleString()} ea</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <input
                      type="number"
                      min={1}
                      value={i.qty}
                      onChange={(e) => updateQty(i.productId, i.storage, i.color, parseInt(e.target.value || "1"))}
                      className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => remove(i.productId, i.storage, i.color)}
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-20 h-fit rounded-3xl bg-surface p-6">
          <h2 className="font-semibold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>${subtotal.toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>Free</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Estimated tax</dt><dd>${tax.toLocaleString()}</dd></div>
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
              <dt>Total</dt><dd>${total.toLocaleString()}</dd>
            </div>
          </dl>

          <button
            disabled
            className="mt-6 w-full py-3 rounded-full bg-foreground text-background text-sm font-medium opacity-70 cursor-not-allowed"
          >
            Pay with Stripe
          </button>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Stripe checkout will activate once payments are enabled.
          </p>
        </aside>
      </div>
    </section>
  );
}
