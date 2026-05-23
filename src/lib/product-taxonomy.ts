import type { Product } from "@/lib/products";

export type ProductTypeFilter =
  | "Night Wear"
  | "Bra & Pant"
  | "Sexy Lingerie"
  | "Sexy Night Wear";

export const requestedProductTypes: ProductTypeFilter[] = [
  "Night Wear",
  "Bra & Pant",
  "Sexy Lingerie",
  "Sexy Night Wear",
];

export const productTypeLandingContent: Record<
  ProductTypeFilter,
  {
    slug: string;
    eyebrow: string;
    title: string;
    description: string;
    badge: string;
  }
> = {
  "Night Wear": {
    slug: "night-wear",
    eyebrow: "After dark",
    title: "Night wear worth staying in for.",
    description:
      "Babydolls, slips, dresses and soft night styles curated for evenings, gifting and lounge-to-bedroom dressing.",
    badge: "Soft-touch edit",
  },
  "Bra & Pant": {
    slug: "bra-and-pant-set",
    eyebrow: "Matched sets",
    title: "Bra and pant sets that do the work for you.",
    description:
      "Coordinated two-piece and three-piece lingerie sets with an instant styled look and less guesswork.",
    badge: "Set dressing",
  },
  "Sexy Lingerie": {
    slug: "sexy-lingerie",
    eyebrow: "Main character",
    title: "Sexy lingerie built for impact.",
    description:
      "The boldest lace, mesh and cut-out styles in the catalog, merchandised for nights out, gifting and confidence buys.",
    badge: "High-conversion picks",
  },
  "Sexy Night Wear": {
    slug: "sexy-night-wear",
    eyebrow: "Late shift",
    title: "Sexy night wear with a little more drama.",
    description:
      "Nightwear silhouettes with sheer panels, body-skimming fits and high-heat styling for evening wear and intimate looks.",
    badge: "After-hours edit",
  },
};

type ProductTaxonomyInput = Pick<Product, "name" | "attributes" | "productType">;

export function inferProductTypes(product: ProductTaxonomyInput): ProductTypeFilter[] {
  if (product.productType && requestedProductTypes.includes(product.productType)) {
    return [product.productType];
  }

  const lowerName = product.name.toLowerCase();
  const styles = (product.attributes?.styles ?? []).map((style) => style.toLowerCase());
  const occasions = (product.attributes?.occasions ?? []).map((occasion) => occasion.toLowerCase());

  const has = (words: string[]) => words.some((word) => lowerName.includes(word));
  const hasStyle = (words: string[]) =>
    words.some((word) => styles.some((style) => style.includes(word)));
  const hasOccasion = (words: string[]) =>
    words.some((word) => occasions.some((occasion) => occasion.includes(word)));

  const inferred: ProductTypeFilter[] = [];
  if (has(["night", "sleep", "nightwear", "babydoll"]) || hasStyle(["dress"])) {
    inferred.push(has(["sexy", "lingerie"]) ? "Sexy Night Wear" : "Night Wear");
  }
  if (
    has(["bra", "panty", "set", "2pcs", "3pcs"]) &&
    (has(["set", "2pcs", "3pcs"]) || hasStyle(["set"]))
  )
    inferred.push("Bra & Pant");
  if (has(["sexy", "lingerie"]) || hasOccasion(["romantic", "party"]))
    inferred.push("Sexy Lingerie");
  if (
    (has(["sexy"]) && has(["night", "sleep", "babydoll", "nightwear"])) ||
    (hasOccasion(["party"]) && has(["night"]))
  )
    inferred.push("Sexy Night Wear");

  if (inferred.length === 0) inferred.push("Sexy Lingerie");
  return Array.from(new Set(inferred));
}

export function getProductTypeSlug(type: ProductTypeFilter): string {
  return productTypeLandingContent[type].slug;
}

export function getProductTypeFromSlug(slug: string): ProductTypeFilter | null {
  if (slug === "bra-and-pant") return "Bra & Pant";
  const entry = requestedProductTypes.find((type) => productTypeLandingContent[type].slug === slug);
  return entry ?? null;
}
