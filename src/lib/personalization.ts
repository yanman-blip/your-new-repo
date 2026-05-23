import { useEffect, useState } from "react";

const PERSONALIZATION_KEY = "wet-lace-personalization-enabled-v1";
const PERSONALIZATION_EVENT = "wet-lace-personalization-updated";

function readPersonalizationEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(PERSONALIZATION_KEY);
    if (!raw) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

function writePersonalizationEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PERSONALIZATION_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new Event(PERSONALIZATION_EVENT));
  } catch {
    // Ignore storage failures in restricted browser environments.
  }
}

export function usePersonalizationSettings() {
  const [enabled, setEnabledState] = useState<boolean>(() => readPersonalizationEnabled());

  useEffect(() => {
    const refresh = () => setEnabledState(readPersonalizationEnabled());
    window.addEventListener("storage", refresh);
    window.addEventListener(PERSONALIZATION_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(PERSONALIZATION_EVENT, refresh);
    };
  }, []);

  const setEnabled = (value: boolean) => {
    writePersonalizationEnabled(value);
    setEnabledState(value);
  };

  return {
    enabled,
    setEnabled,
    toggle: () => setEnabled(!enabled),
  };
}
