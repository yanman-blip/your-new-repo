import { useSyncExternalStore } from "react";

const WISHLIST_KEY = "loftie-wishlist-v1";

let _ids: string[] = [];
const _listeners = new Set<() => void>();

function load() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (raw) _ids = JSON.parse(raw) as string[];
  } catch {}
}

function save() {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(_ids));
  } catch {}
  _listeners.forEach((l) => l());
}

if (typeof window !== "undefined") load();

function subscribeWishlist(cb: () => void) {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

function getIds() { return _ids; }
function getServerIds(): string[] { return []; }

export function toggleWishlist(id: string) {
  if (_ids.includes(id)) {
    _ids = _ids.filter((i) => i !== id);
  } else {
    _ids = [..._ids, id];
  }
  save();
}

export function useWishlist() {
  const ids = useSyncExternalStore(subscribeWishlist, getIds, getServerIds);
  return {
    ids,
    count: ids.length,
    isWishlisted: (id: string) => ids.includes(id),
    toggle: toggleWishlist,
  };
}
