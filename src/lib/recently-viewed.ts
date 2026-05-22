import { useEffect, useMemo, useState } from "react";
import { getProducts, type Product } from "./products";

const RECENTLY_VIEWED_KEY = "wet-lace-recently-viewed-v1";
const RECENTLY_VIEWED_EVENT = "wet-lace-recently-viewed-updated";
const MAX_RECENTLY_VIEWED = 20;

function readRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function writeRecentlyViewedIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
  } catch {
    // Ignore localStorage failures in private mode or restricted environments.
  }
}

export function markProductRecentlyViewed(productId: string) {
  if (!productId) return;
  const ids = readRecentlyViewedIds();
  const next = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX_RECENTLY_VIEWED);
  writeRecentlyViewedIds(next);
}

export function useRecentlyViewedProducts(limit = 8): Product[] {
  const [ids, setIds] = useState<string[]>(() => readRecentlyViewedIds());

  useEffect(() => {
    const refresh = () => setIds(readRecentlyViewedIds());
    window.addEventListener("storage", refresh);
    window.addEventListener(RECENTLY_VIEWED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(RECENTLY_VIEWED_EVENT, refresh);
    };
  }, []);

  return useMemo(() => {
    const products = getProducts();
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is Product => !!p)
      .slice(0, Math.max(0, limit));
  }, [ids, limit]);
}
