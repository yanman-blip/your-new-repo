/**
 * Generates a consistent price string with realistic cents derived
 * deterministically from the product id, so the same product always
 * shows the same price on every render.
 *
 * e.g. price=12, id="abc..." → "$12.47"
 */
export function formatPrice(price: number, id: string): string {
  const hash = id.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0);
  const cents = (hash % 99) + 1; // 01–99, never .00
  return `$${price}.${cents.toString().padStart(2, "0")}`;
}

export function formatOldPrice(price: number, id: string): string {
  const hash = id.split("").reduce((acc, c) => (acc * 17 + c.charCodeAt(0)) & 0xffff, 0);
  const cents = (hash % 99) + 1;
  return `$${price}.${cents.toString().padStart(2, "0")}`;
}
