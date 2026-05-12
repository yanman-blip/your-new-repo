import { useCart } from "@/lib/cart";
import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";

export function CartDrawer() {
  const { open, setOpen, detailed, subtotal, updateQty, remove, count } = useCart();

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-background border-l border-border shadow-2xl transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between px-6 h-14 border-b border-border">
          <div className="flex items-center gap-2 font-semibold">
            <ShoppingBag className="w-4 h-4" /> Your bag ({count})
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {detailed.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm">
              Your bag is empty.
              <div className="mt-4">
                <Link to="/shop" onClick={() => setOpen(false)} className="text-foreground underline underline-offset-4">
                  Start shopping
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {detailed.map((i) => (
                <li key={`${i.productId}-${i.storage}-${i.color}`} className="py-4 flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-surface overflow-hidden flex-shrink-0">
                    <img src={i.product.image} alt={i.product.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="font-medium truncate">{i.product.name}</div>
                      <div className="font-medium">${i.lineTotal.toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {i.storage} · {i.color}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-border rounded-full">
                        <button
                          onClick={() => updateQty(i.productId, i.storage, i.color, i.qty - 1)}
                          className="p-1.5 hover:text-foreground text-muted-foreground"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{i.qty}</span>
                        <button
                          onClick={() => updateQty(i.productId, i.storage, i.color, i.qty + 1)}
                          className="p-1.5 hover:text-foreground text-muted-foreground"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(i.productId, i.storage, i.color)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {detailed.length > 0 && (
          <footer className="border-t border-border px-6 py-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">${subtotal.toLocaleString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">Taxes & shipping calculated at checkout.</div>
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition"
            >
              Checkout
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}
