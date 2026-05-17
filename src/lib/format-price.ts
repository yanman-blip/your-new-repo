/**
 * Formats a price as currency using the actual numeric value.
 * Admin-entered decimals are preserved, and whole numbers render as .00.
 */
export function formatPrice(price: number, id: string): string {
  void id;
  const safe = Number.isFinite(price) ? price : 0;
  return `$${safe.toFixed(2)}`;
}

export function formatOldPrice(price: number, id: string): string {
  void id;
  const safe = Number.isFinite(price) ? price : 0;
  return `$${safe.toFixed(2)}`;
}
