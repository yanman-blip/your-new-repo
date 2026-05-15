import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProducts, type Product } from "./products";

export type CartItem = {
  productId: string;
  storage: string;
  color: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: CartItem) => void;
  remove: (productId: string, storage: string, color: string) => void;
  updateQty: (productId: string, storage: string, color: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  detailed: (CartItem & { product: Product; lineTotal: number })[];
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kingpin-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const products = getProducts();
    const detailed = items
      .map((i) => {
        const product = products.find((p) => p.id === i.productId);
        if (!product) return null;
        return { ...i, product, lineTotal: product.price * i.qty };
      })
      .filter(Boolean) as (CartItem & { product: Product; lineTotal: number })[];
    return {
      items,
      open,
      setOpen,
      add: (item) =>
        setItems((prev) => {
          const i = prev.findIndex(
            (p) => p.productId === item.productId && p.storage === item.storage && p.color === item.color,
          );
          if (i >= 0) {
            const next = [...prev];
            next[i] = { ...next[i], qty: next[i].qty + item.qty };
            return next;
          }
          return [...prev, item];
        }),
      remove: (productId, storage, color) =>
        setItems((prev) =>
          prev.filter((p) => !(p.productId === productId && p.storage === storage && p.color === color)),
        ),
      updateQty: (productId, storage, color, qty) =>
        setItems((prev) =>
          prev
            .map((p) =>
              p.productId === productId && p.storage === storage && p.color === color
                ? { ...p, qty: Math.max(0, qty) }
                : p,
            )
            .filter((p) => p.qty > 0),
        ),
      clear: () => setItems([]),
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: detailed.reduce((s, i) => s + i.lineTotal, 0),
      detailed,
    };
  }, [items, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
