import { useCart } from "@/lib/cart";
import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { getProducts } from "@/lib/products";
import { formatPrice } from "@/lib/format-price";
import { useMemo } from "react";
import { useRecentlyViewedProducts } from "@/lib/recently-viewed";

export function CartDrawer() {
  const { open, setOpen, detailed, subtotal, updateQty, remove, count, add } = useCart();
  const recentlyViewed = useRecentlyViewedProducts(8);
  const recommendations = useMemo(() => {
    const allProducts = getProducts();
    const cartIds = new Set(detailed.map((item) => item.productId));
    const cartBrands = new Set(detailed.map((item) => item.product.brand));
    const recentIds = new Set(recentlyViewed.map((item) => item.id));

    const ranked = allProducts
      .filter((product) => !cartIds.has(product.id))
      .map((product) => {
        let score = 0;
        if (recentIds.has(product.id)) score += 25;
        if (cartBrands.has(product.brand)) score += 14;
        if (product.badge?.toLowerCase().includes("best")) score += 8;
        if (product.badge?.toLowerCase().includes("new")) score += 6;
        return { product, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((entry) => entry.product);

    return ranked;
  }, [detailed, recentlyViewed]);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-60 bg-black/40 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed top-0 right-0 z-70 h-full w-full max-w-md bg-background border-l border-border shadow-2xl transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}
        hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
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
                  <div className="w-20 h-20 rounded-xl bg-surface overflow-hidden shrink-0">
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
            {recommendations.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">Recommended for you</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recommendations.map((product) => (
                    <div key={product.id} className="min-w-40 rounded-lg border border-border bg-background p-2">
                      {product.image && <img src={product.image} alt={product.name} className="h-20 w-full rounded object-cover" />}
                      <p className="mt-2 line-clamp-2 text-xs font-medium text-foreground">{product.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatPrice(product.price, product.id)}</p>
                      <button
                        type="button"
                        onClick={() =>
                          add({
                            productId: product.id,
                            storage: product.storage[0] ?? "M",
                            color: product.colors[0]?.name ?? "Default",
                            qty: 1,
                          })
                        }
                        className="mt-2 w-full rounded border border-border px-2 py-1 text-xs text-foreground transition hover:bg-muted"
                      >
                        + Add to bag
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
