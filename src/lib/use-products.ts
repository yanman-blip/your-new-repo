import { useEffect, useSyncExternalStore } from "react";
import {
  fetchCustomProducts,
  flushPendingWrites,
  getProducts,
  getServerProducts,
  subscribeProducts,
  subscribeProductsRealtime,
} from "@/lib/products";

export function useProducts() {
  const products = useSyncExternalStore(subscribeProducts, getProducts, getServerProducts);

  useEffect(() => {
    // Initial cloud fetch, retry any unsynced local writes, then attach the
    // realtime channel so admin edits in another tab push to this one live.
    void fetchCustomProducts();
    void flushPendingWrites();
    const unsubscribe = subscribeProductsRealtime();
    return unsubscribe;
  }, []);

  return products;
}
