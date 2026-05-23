import { useEffect, useSyncExternalStore } from "react";
import { fetchCloudSetting, upsertCloudSetting } from "@/lib/cloud-settings";

export type HomeMerchandisingSettings = {
  featuredProductId: string;
  heroRotationMs: number;
  categoryShortcuts: string[];
  flashSaleLabel: string;
  flashSaleCode: string;
  saleRailTitle: string;
  saleStartIndex: number;
  saleCount: number;
  newDropsCount: number;
  trendingCount: number;
};

const HOME_MERCH_SETTINGS_KEY = "wet-lace-home-merch-settings-v1";
const HOME_MERCH_SETTINGS_EVENT = "wet-lace-home-merch-settings-updated";
const HOME_MERCH_SETTINGS_CLOUD_KEY = "home_merchandising";
const listeners = new Set<() => void>();
let cloudHydrationPromise: Promise<void> | null = null;
let cloudSyncTimer: ReturnType<typeof setTimeout> | null = null;

const defaultHomeMerchandisingSettings: HomeMerchandisingSettings = {
  featuredProductId: "sleeveless-sexy-bandage-dress",
  heroRotationMs: 5000,
  categoryShortcuts: ["Lingerie Sets", "Babydolls", "Bodysuits", "Plus Size", "Sleepwear", "Leggings"],
  flashSaleLabel: "Extra 15% Off",
  flashSaleCode: "WET15",
  saleRailTitle: "Flash Sale Picks",
  saleStartIndex: 8,
  saleCount: 6,
  newDropsCount: 8,
  trendingCount: 8,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeSettings(candidate: Partial<HomeMerchandisingSettings> | null | undefined): HomeMerchandisingSettings {
  return {
    featuredProductId: typeof candidate?.featuredProductId === "string" ? candidate.featuredProductId.trim() : defaultHomeMerchandisingSettings.featuredProductId,
    heroRotationMs: clamp(Number.isFinite(candidate?.heroRotationMs) ? Number(candidate?.heroRotationMs) : defaultHomeMerchandisingSettings.heroRotationMs, 2000, 15000),
    categoryShortcuts:
      Array.isArray(candidate?.categoryShortcuts) && candidate.categoryShortcuts.length > 0
        ? candidate.categoryShortcuts
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, 12)
        : defaultHomeMerchandisingSettings.categoryShortcuts,
    flashSaleLabel:
      typeof candidate?.flashSaleLabel === "string" && candidate.flashSaleLabel.trim().length > 0
        ? candidate.flashSaleLabel.trim().slice(0, 48)
        : defaultHomeMerchandisingSettings.flashSaleLabel,
    flashSaleCode:
      typeof candidate?.flashSaleCode === "string" && candidate.flashSaleCode.trim().length > 0
        ? candidate.flashSaleCode.trim().slice(0, 24)
        : defaultHomeMerchandisingSettings.flashSaleCode,
    saleRailTitle:
      typeof candidate?.saleRailTitle === "string" && candidate.saleRailTitle.trim().length > 0
        ? candidate.saleRailTitle.trim().slice(0, 48)
        : defaultHomeMerchandisingSettings.saleRailTitle,
    saleStartIndex: clamp(
      Number.isFinite(candidate?.saleStartIndex) ? Number(candidate?.saleStartIndex) : defaultHomeMerchandisingSettings.saleStartIndex,
      0,
      200,
    ),
    saleCount: clamp(Number.isFinite(candidate?.saleCount) ? Number(candidate?.saleCount) : defaultHomeMerchandisingSettings.saleCount, 1, 24),
    newDropsCount: clamp(Number.isFinite(candidate?.newDropsCount) ? Number(candidate?.newDropsCount) : defaultHomeMerchandisingSettings.newDropsCount, 1, 24),
    trendingCount: clamp(Number.isFinite(candidate?.trendingCount) ? Number(candidate?.trendingCount) : defaultHomeMerchandisingSettings.trendingCount, 1, 24),
  };
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function readSettings(): HomeMerchandisingSettings {
  if (typeof window === "undefined") return defaultHomeMerchandisingSettings;
  try {
    const raw = localStorage.getItem(HOME_MERCH_SETTINGS_KEY);
    if (!raw) return defaultHomeMerchandisingSettings;
    const parsed = JSON.parse(raw) as Partial<HomeMerchandisingSettings>;
    return normalizeSettings(parsed);
  } catch {
    return defaultHomeMerchandisingSettings;
  }
}

function scheduleCloudSync(next: HomeMerchandisingSettings) {
  if (typeof window === "undefined") return;
  if (cloudSyncTimer) {
    window.clearTimeout(cloudSyncTimer);
  }

  cloudSyncTimer = window.setTimeout(() => {
    void upsertCloudSetting(HOME_MERCH_SETTINGS_CLOUD_KEY, next);
    cloudSyncTimer = null;
  }, 700);
}

async function hydrateSettingsFromCloud() {
  if (typeof window === "undefined") return;
  if (cloudHydrationPromise) return cloudHydrationPromise;

  cloudHydrationPromise = (async () => {
    const cloud = await fetchCloudSetting<Partial<HomeMerchandisingSettings>>(HOME_MERCH_SETTINGS_CLOUD_KEY);
    if (!cloud) return;

    const local = readSettings();
    const merged = normalizeSettings({ ...local, ...cloud });
    writeSettings(merged, { syncCloud: false });
  })();

  await cloudHydrationPromise;
}

function writeSettings(next: HomeMerchandisingSettings, options?: { syncCloud?: boolean }) {
  const shouldSyncCloud = options?.syncCloud ?? true;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HOME_MERCH_SETTINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(HOME_MERCH_SETTINGS_EVENT));
  } catch {
    // Ignore storage failures.
  }
  if (shouldSyncCloud) scheduleCloudSync(next);
  emitChange();
}

function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  const onWindowEvent = () => listener();
  if (typeof window !== "undefined") {
    window.addEventListener(HOME_MERCH_SETTINGS_EVENT, onWindowEvent);
    window.addEventListener("storage", onWindowEvent);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener(HOME_MERCH_SETTINGS_EVENT, onWindowEvent);
      window.removeEventListener("storage", onWindowEvent);
    }
  };
}

function getSnapshot() {
  return readSettings();
}

function getServerSnapshot() {
  return defaultHomeMerchandisingSettings;
}

export function useHomeMerchandisingSettings() {
  const settings = useSyncExternalStore(subscribeSettings, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void hydrateSettingsFromCloud();
  }, []);

  const update = (patch: Partial<HomeMerchandisingSettings>) => {
    writeSettings(normalizeSettings({ ...settings, ...patch }));
  };

  const reset = () => writeSettings(defaultHomeMerchandisingSettings);

  return {
    settings,
    update,
    reset,
    defaults: defaultHomeMerchandisingSettings,
  };
}

export {
  HOME_MERCH_SETTINGS_EVENT,
  HOME_MERCH_SETTINGS_KEY,
  defaultHomeMerchandisingSettings,
};