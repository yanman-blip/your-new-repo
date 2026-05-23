import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProducts, type Product } from "./products";

export type CartItem = {
  productId: string;
  storage: string;
  color: string;
  qty: number;
};

export type Coupon = {
  code: string;
  discount: number; // percentage (e.g., 10 for 10% off)
  minOrder: number; // minimum order amount to apply
  expiresAt: Date;
};

// Simple coupon database - in production, fetch from backend
const AVAILABLE_COUPONS: Coupon[] = [
  { code: "WELCOME10", discount: 10, minOrder: 0, expiresAt: new Date("2026-12-31") },
  { code: "SAVE20", discount: 20, minOrder: 50, expiresAt: new Date("2026-12-31") },
];

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
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: Coupon | null;
  couponError: string;
  discountAmount: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "loftie-cart-v1";

function evaluateCoupon(
  rawCode: string,
  subtotal: number,
): { appliedCoupon: Coupon | null; couponError: string; discountAmount: number } {
  const code = rawCode.trim();
  if (!code) return { appliedCoupon: null, couponError: "", discountAmount: 0 };

  const found = AVAILABLE_COUPONS.find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (!found) {
    return { appliedCoupon: null, couponError: "Coupon code not found or expired.", discountAmount: 0 };
  }
  if (found.expiresAt < new Date()) {
    return { appliedCoupon: null, couponError: "This coupon has expired.", discountAmount: 0 };
  }
  if (subtotal < found.minOrder) {
    return {
      appliedCoupon: null,
      couponError: `Minimum order of $${found.minOrder} required for this coupon.`,
      discountAmount: 0,
    };
  }

  const discountAmount = Math.round(((subtotal * found.discount) / 100) * 100) / 100;
  return { appliedCoupon: found, couponError: "", discountAmount };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [couponCode, setCouponCode] = useState("");

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

    const subtotal = detailed.reduce((s, i) => s + i.lineTotal, 0);

    // Coupon state is derived purely from code + subtotal — no setState during
    // render. An invalid/insufficient code yields a message but no discount.
    const { appliedCoupon, couponError, discountAmount } = evaluateCoupon(couponCode, subtotal);

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
      subtotal,
      detailed,
      couponCode,
      setCouponCode,
      appliedCoupon,
      couponError,
      discountAmount,
    };
  }, [items, open, couponCode]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function useOptionalCart() {
  return useContext(CartContext);
}
