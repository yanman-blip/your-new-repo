type ProductMetrics = {
  impressions: number;
  clicks: number;
};

type RailMetrics = {
  impressions: number;
  clicks: number;
  products: Record<string, ProductMetrics>;
};

type AnalyticsStore = Record<string, RailMetrics>;

const ANALYTICS_KEY = "wet-lace-recommendation-analytics-v1";
const ANALYTICS_EVENT = "wet-lace-recommendation-analytics-updated";
const seenImpressions = new Set<string>();

function readStore(): AnalyticsStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AnalyticsStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: AnalyticsStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(ANALYTICS_EVENT));
  } catch {
    // Ignore storage failures in restricted browser environments.
  }
}

function ensureRail(store: AnalyticsStore, rail: string): RailMetrics {
  const current = store[rail];
  if (current) return current;
  const created: RailMetrics = { impressions: 0, clicks: 0, products: {} };
  store[rail] = created;
  return created;
}

function ensureProduct(railMetrics: RailMetrics, productId: string): ProductMetrics {
  const current = railMetrics.products[productId];
  if (current) return current;
  const created: ProductMetrics = { impressions: 0, clicks: 0 };
  railMetrics.products[productId] = created;
  return created;
}

export function trackRecommendationImpression(rail: string, productId: string) {
  if (!rail || !productId || typeof window === "undefined") return;

  const dedupeKey = `${rail}:${productId}`;
  if (seenImpressions.has(dedupeKey)) return;
  seenImpressions.add(dedupeKey);

  const store = readStore();
  const railMetrics = ensureRail(store, rail);
  const productMetrics = ensureProduct(railMetrics, productId);

  railMetrics.impressions += 1;
  productMetrics.impressions += 1;

  writeStore(store);
}

export function trackRecommendationClick(rail: string, productId: string) {
  if (!rail || !productId || typeof window === "undefined") return;

  const store = readStore();
  const railMetrics = ensureRail(store, rail);
  const productMetrics = ensureProduct(railMetrics, productId);

  railMetrics.clicks += 1;
  productMetrics.clicks += 1;

  writeStore(store);
}

export { ANALYTICS_EVENT, ANALYTICS_KEY };
