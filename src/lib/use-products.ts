import { useEffect, useSyncExternalStore } from "react";
import { fetchCustomProducts, getProducts, subscribeProducts } from "@/lib/products";

export function useProducts() {
  const products = useSyncExternalStore(subscribeProducts, getProducts, getProducts);

  useEffect(() => {
    void fetchCustomProducts();
  }, []);

  return products;
}
