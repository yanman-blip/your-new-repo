import { useEffect, useSyncExternalStore } from "react";
import { fetchCloudSetting, upsertCloudSetting } from "@/lib/cloud-settings";

export type SearchAnalyticsEntry = {
  query: string;
  searches: number;
  zeroResults: number;
  clicks: number;
  lastSearchedAt: string;
  lastClickedAt?: string;
  destinations: Record<string, number>;
};

type SearchAnalyticsStore = Record<string, SearchAnalyticsEntry>;

const SEARCH_ANALYTICS_KEY = "wet-lace-search-analytics-v1";
const SEARCH_ANALYTICS_EVENT = "wet-lace-search-analytics-updated";
const SEARCH_ANALYTICS_CLOUD_KEY = "search_analytics";
const listeners = new Set<() => void>();
let cloudHydrationPromise: Promise<void> | null = null;
let cloudSyncTimer: ReturnType<typeof setTimeout> | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function readStore(): SearchAnalyticsStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SEARCH_ANALYTICS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SearchAnalyticsStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function mergeStores(localStore: SearchAnalyticsStore, cloudStore: SearchAnalyticsStore): SearchAnalyticsStore {
  const merged: SearchAnalyticsStore = { ...cloudStore };
  for (const [query, localEntry] of Object.entries(localStore)) {
    const cloudEntry = merged[query];
    if (!cloudEntry) {
      merged[query] = localEntry;
      continue;
    }

    const destinations: Record<string, number> = { ...cloudEntry.destinations };
    for (const [destination, count] of Object.entries(localEntry.destinations)) {
      destinations[destination] = Math.max(destinations[destination] ?? 0, count);
    }

    merged[query] = {
      query,
      searches: Math.max(cloudEntry.searches, localEntry.searches),
      zeroResults: Math.max(cloudEntry.zeroResults, localEntry.zeroResults),
      clicks: Math.max(cloudEntry.clicks, localEntry.clicks),
      lastSearchedAt: new Date(
        Math.max(new Date(cloudEntry.lastSearchedAt).getTime(), new Date(localEntry.lastSearchedAt).getTime()),
      ).toISOString(),
      lastClickedAt:
        cloudEntry.lastClickedAt || localEntry.lastClickedAt
          ? new Date(
              Math.max(
                cloudEntry.lastClickedAt ? new Date(cloudEntry.lastClickedAt).getTime() : 0,
                localEntry.lastClickedAt ? new Date(localEntry.lastClickedAt).getTime() : 0,
              ),
            ).toISOString()
          : undefined,
      destinations,
    };
  }

  return merged;
}

function scheduleCloudSync(store: SearchAnalyticsStore) {
  if (typeof window === "undefined") return;
  if (cloudSyncTimer) {
    window.clearTimeout(cloudSyncTimer);
  }

  cloudSyncTimer = window.setTimeout(() => {
    void upsertCloudSetting(SEARCH_ANALYTICS_CLOUD_KEY, store);
    cloudSyncTimer = null;
  }, 1200);
}

async function hydrateStoreFromCloud() {
  if (typeof window === "undefined") return;
  if (cloudHydrationPromise) return cloudHydrationPromise;

  cloudHydrationPromise = (async () => {
    const cloud = await fetchCloudSetting<SearchAnalyticsStore>(SEARCH_ANALYTICS_CLOUD_KEY);
    if (!cloud || typeof cloud !== "object") return;
    const merged = mergeStores(readStore(), cloud);
    writeStore(merged, { syncCloud: false });
  })();

  await cloudHydrationPromise;
}

function writeStore(store: SearchAnalyticsStore, options?: { syncCloud?: boolean }) {
  const shouldSyncCloud = options?.syncCloud ?? true;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEARCH_ANALYTICS_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(SEARCH_ANALYTICS_EVENT));
  } catch {
    // Ignore storage failures.
  }
  if (shouldSyncCloud) scheduleCloudSync(store);
  emitChange();
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function ensureEntry(store: SearchAnalyticsStore, query: string): SearchAnalyticsEntry {
  const existing = store[query];
  if (existing) return existing;
  const created: SearchAnalyticsEntry = {
    query,
    searches: 0,
    zeroResults: 0,
    clicks: 0,
    lastSearchedAt: new Date(0).toISOString(),
    destinations: {},
  };
  store[query] = created;
  return created;
}

export function trackSearchQuery(query: string, resultCount: number) {
  if (typeof window === "undefined") return;
  const normalized = normalizeQuery(query);
  if (normalized.length < 2) return;

  const store = readStore();
  const entry = ensureEntry(store, normalized);
  entry.searches += 1;
  if (resultCount === 0) entry.zeroResults += 1;
  entry.lastSearchedAt = new Date().toISOString();
  writeStore(store);
}

export function trackSearchResultClick(query: string, destination: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeQuery(query);
  if (normalized.length < 2 || !destination.trim()) return;

  const store = readStore();
  const entry = ensureEntry(store, normalized);
  entry.clicks += 1;
  entry.lastClickedAt = new Date().toISOString();
  entry.destinations[destination] = (entry.destinations[destination] ?? 0) + 1;
  writeStore(store);
}

function subscribeSearchAnalytics(listener: () => void) {
  listeners.add(listener);

  const onWindowEvent = () => listener();
  if (typeof window !== "undefined") {
    window.addEventListener(SEARCH_ANALYTICS_EVENT, onWindowEvent);
    window.addEventListener("storage", onWindowEvent);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener(SEARCH_ANALYTICS_EVENT, onWindowEvent);
      window.removeEventListener("storage", onWindowEvent);
    }
  };
}

function getSnapshot() {
  return Object.values(readStore()).sort((left, right) => right.searches - left.searches);
}

function getServerSnapshot(): SearchAnalyticsEntry[] {
  return [];
}

export function useSearchAnalytics() {
  const entries = useSyncExternalStore(subscribeSearchAnalytics, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void hydrateStoreFromCloud();
  }, []);

  return entries;
}

export function clearSearchAnalytics() {
  writeStore({});
}

export { SEARCH_ANALYTICS_EVENT, SEARCH_ANALYTICS_KEY };