import { useEffect, useSyncExternalStore } from "react";
import { fetchCustomProducts, getProducts, getServerProducts, subscribeProducts } from "@/lib/products";

export function useProducts() {
  const products = useSyncExternalStore(subscribeProducts, getProducts, getServerProducts);

  useEffect(() => {
    void fetchCustomProducts();
  }, []);

  return products;
}
