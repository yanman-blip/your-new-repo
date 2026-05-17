import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import {
  flushPendingWrites,
  getPendingProductIds,
  getProducts,
  subscribeProducts,
} from "@/lib/products";

export function PendingSyncToast() {
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const recompute = () => {
      const next = getPendingProductIds();
      setPendingIds(next);
      if (next.length === 0) setDismissed(false);
    };
    recompute();
    const unsubscribe = subscribeProducts(recompute);
    return unsubscribe;
  }, []);

  if (pendingIds.length === 0 || dismissed) return null;

  const products = getProducts();
  const labels = pendingIds.slice(0, 3).map((id) => {
    const product = products.find((p) => p.id === id);
    return product ? product.name : id;
  });

  const retry = async () => {
    setRetrying(true);
    try {
      await flushPendingWrites();
    } finally {
      setRetrying(false);
      setPendingIds(getPendingProductIds());
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="pointer-events-auto rounded-xl border border-[#ffd8a8] bg-[#fff5e8] p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#a85d00]">
              {pendingIds.length} change{pendingIds.length === 1 ? "" : "s"} pending cloud sync
            </div>
            <ul className="mt-1 space-y-0.5 text-xs text-[#a85d00]/85">
              {labels.map((label, i) => (
                <li key={i} className="truncate">
                  • {label}
                </li>
              ))}
              {pendingIds.length > labels.length && (
                <li className="text-[#a85d00]/70">
                  …and {pendingIds.length - labels.length} more
                </li>
              )}
            </ul>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-[#a85d00]/70 hover:bg-[#ffeacb]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => void retry()}
          disabled={retrying}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#a85d00] bg-white px-3 py-1.5 text-xs font-medium text-[#a85d00] hover:bg-[#fff8ef] disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Retrying…" : "Retry now"}
        </button>
      </div>
    </div>
  );
}
