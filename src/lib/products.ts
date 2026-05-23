import { getOptionalSupabase } from "@/integrations/supabase/optional-client";
import { getLocalProductImageOverride } from "@/lib/public-product-images";
import { publicGeneratedProducts } from "@/lib/public-products.generated";

export type Collection = "Lace" | "Silk" | "Lounge" | "Everyday";

export type ProductCoverage = "Sheer" | "Semi-Sheer" | "Opaque";

export type ProductAttributes = {
  occasions: string[];
  fabrics: string[];
  styles: string[];
  coverage: ProductCoverage;
};

export type ProductSizeFit = "runs-small" | "true-to-size" | "runs-large";

export type ProductSizeGuideMeasurement = {
  size: string;
  bust: string;
  hips: string;
};

export type ProductSizeGuide = {
  fit: ProductSizeFit;
  guidance: string;
  chart: ProductSizeGuideMeasurement[];
};

export type Product = {
  id: string;
  name: string;
  brand: Collection; // collection label, kept as `brand` for compatibility
  tagline: string;
  description: string;
  price: number;
  image: string;
  gallery?: string[];
  bg: string;
  accent: string;
  badge?: string;
  storage: string[]; // sizes - kept as `storage` for compatibility with existing UI
  colors: { name: string; hex: string }[];
  highlights: string[];
  attributes?: ProductAttributes;
  sizeGuide?: ProductSizeGuide;
};

const KNOWN_COLLECTIONS: Collection[] = ["Lace", "Silk", "Lounge", "Everyday"];

function normalizeCollection(value: unknown): Collection {
  if (typeof value !== "string") return "Lace";
  const match = KNOWN_COLLECTIONS.find((collection) => collection.toLowerCase() === value.toLowerCase());
  return match ?? "Lace";
}

function normalizeSizeLabel(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const compact = raw.toLowerCase().replace(/\s+/g, " ");
  if (compact === "one size" || compact === "onesize") return "One Size";
  if (["xs", "s", "m", "l", "xl", "xxl", "xxxl"].includes(compact)) return compact.toUpperCase();
  return raw;
}

function normalizeColorName(name: string): string {
  const decoded = (() => {
    try {
      return decodeURIComponent(name);
    } catch {
      return name;
    }
  })();

  const withoutHex = decoded.replace(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6,8})\b/g, " ");
  const cleaned = withoutHex
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-zA-Z\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Black";

  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getDefaultSizeGuide(storage: string[]): ProductSizeGuide {
  const commonChart: Record<string, { bust: string; hips: string }> = {
    XS: { bust: "76-82 cm", hips: "82-88 cm" },
    S: { bust: "80-86 cm", hips: "86-92 cm" },
    M: { bust: "86-92 cm", hips: "92-98 cm" },
    L: { bust: "92-98 cm", hips: "98-104 cm" },
    XL: { bust: "98-104 cm", hips: "104-110 cm" },
    XXL: { bust: "104-110 cm", hips: "110-116 cm" },
    "One Size": { bust: "80-104 cm", hips: "86-112 cm" },
  };

  const chart = storage
    .slice(0, 8)
    .map((size) => ({
      size,
      bust: commonChart[size]?.bust ?? "Refer to fit notes",
      hips: commonChart[size]?.hips ?? "Refer to fit notes",
    }));

  return {
    fit: "true-to-size",
    guidance: "Most shoppers choose their usual size for this style.",
    chart,
  };
}

function normalizeSizeGuide(value: unknown, storage: string[]): ProductSizeGuide {
  const fallback = getDefaultSizeGuide(storage);
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<ProductSizeGuide> & { chart?: unknown };
  const fit: ProductSizeFit =
    candidate.fit === "runs-small" || candidate.fit === "runs-large" || candidate.fit === "true-to-size"
      ? candidate.fit
      : fallback.fit;
  const guidance =
    typeof candidate.guidance === "string" && candidate.guidance.trim().length > 0
      ? candidate.guidance.trim()
      : fallback.guidance;

  const chartRaw = Array.isArray(candidate.chart) ? candidate.chart : [];
  const chart = chartRaw
    .filter(
      (item): item is ProductSizeGuideMeasurement =>
        !!item &&
        typeof item === "object" &&
        typeof (item as { size?: unknown }).size === "string" &&
        typeof (item as { bust?: unknown }).bust === "string" &&
        typeof (item as { hips?: unknown }).hips === "string",
    )
    .map((item) => ({
      size: item.size.trim(),
      bust: item.bust.trim(),
      hips: item.hips.trim(),
    }))
    .filter((item) => item.size && item.bust && item.hips)
    .slice(0, 12);

  return {
    fit,
    guidance,
    chart: chart.length > 0 ? chart : fallback.chart,
  };
}

function deriveProductAttributes(input: {
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
}): ProductAttributes {
  const corpus = `${input.name} ${input.tagline} ${input.description} ${input.highlights.join(" ")}`.toLowerCase();

  const hasAny = (keywords: string[]) => keywords.some((keyword) => corpus.includes(keyword));

  const occasions: string[] = [];
  if (hasAny(["valentine", "romantic", "date night"])) occasions.push("Romantic");
  if (hasAny(["party", "club", "nightclub", "festival", "going out"])) occasions.push("Party");
  if (hasAny(["bridal", "wedding"])) occasions.push("Bridal");
  if (hasAny(["everyday", "daily", "comfort", "casual"])) occasions.push("Everyday");
  if (hasAny(["sleep", "lounge", "nightwear"])) occasions.push("Loungewear");
  if (occasions.length === 0) occasions.push("Romantic");

  const fabrics: string[] = [];
  if (hasAny(["lace"])) fabrics.push("Lace");
  if (hasAny(["mesh", "fishnet"])) fabrics.push("Mesh");
  if (hasAny(["satin"])) fabrics.push("Satin");
  if (hasAny(["silk"])) fabrics.push("Silk");
  if (hasAny(["leather", "pu leather", "patent leather"])) fabrics.push("Leather");
  if (fabrics.length === 0) fabrics.push("Mixed");

  const styles: string[] = [];
  if (hasAny(["bodysuit"])) styles.push("Bodysuit");
  if (hasAny(["set", "2pcs", "3pcs", "4pcs"])) styles.push("Set");
  if (hasAny(["dress", "babydoll"])) styles.push("Dress");
  if (hasAny(["bra", "bralette"])) styles.push("Bra");
  if (hasAny(["panty", "thong"])) styles.push("Panty");
  if (styles.length === 0) styles.push("Lingerie");

  let coverage: ProductCoverage = "Opaque";
  if (hasAny(["sheer", "see through", "fishnet"])) coverage = "Sheer";
  else if (hasAny(["lace", "mesh", "hollow out", "hollow-out", "semi sheer", "semi-sheer"])) coverage = "Semi-Sheer";

  return {
    occasions: Array.from(new Set(occasions.map((item) => toTitleCase(item)))),
    fabrics: Array.from(new Set(fabrics.map((item) => toTitleCase(item)))),
    styles: Array.from(new Set(styles.map((item) => toTitleCase(item)))),
    coverage,
  };
}

function normalizePath(rawPath: string): string {
  const [pathWithLeadingSlash, searchAndHash = ""] = rawPath.split(/(?=[?#])/);
  const hasLeadingSlash = pathWithLeadingSlash.startsWith("/");
  const segments = pathWithLeadingSlash
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    });

  return `${hasLeadingSlash ? "/" : ""}${segments.join("/")}${searchAndHash}`;
}

function normalizeLocalPublicPath(rawPath: string): string {
  const [pathWithLeadingSlash, searchAndHash = ""] = rawPath.split(/(?=[?#])/);
  const hasLeadingSlash = pathWithLeadingSlash.startsWith("/");
  const segments = pathWithLeadingSlash
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  return `${hasLeadingSlash ? "/" : ""}${segments.join("/")}${searchAndHash}`;
}

function normalizeImageUrl(image: string): string {
  if (!image) return image;

  if (/^https?:\/\//i.test(image)) {
    try {
      const url = new URL(image);
      url.pathname = normalizePath(url.pathname);

      if (url.hostname.endsWith("supabase.co")) {
        const objectPrefix = "/storage/v1/object/public/product-images/";
        const renderPrefix = "/storage/v1/render/image/public/product-images/";

        if (url.pathname.includes(objectPrefix)) {
          url.pathname = url.pathname.replace(objectPrefix, renderPrefix);
        }

        if (url.pathname.includes(renderPrefix)) {
          if (!url.searchParams.has("quality")) url.searchParams.set("quality", "85");
          if (!url.searchParams.has("width")) url.searchParams.set("width", "1200");
        }
      }

      return url.toString();
    } catch {
      return image;
    }
  }

  if (image.startsWith("/")) {
    return normalizeLocalPublicPath(image);
  }

  return image;
}

function normalizeProductImages(product: Product): Product {
  const localOverride = getLocalProductImageOverride(product.name, product.image);
  const normalizedImage = normalizeImageUrl(localOverride?.image ?? product.image);
  const normalizedGallery =
    localOverride?.gallery && localOverride.gallery.length > 0
      ? localOverride.gallery.map((img) => normalizeImageUrl(img))
      : product.gallery && product.gallery.length > 0
        ? product.gallery.map((img) => normalizeImageUrl(img))
      : [normalizedImage];

  return {
    ...product,
    image: normalizedImage,
    gallery: normalizedGallery,
  };
}

function sanitizeProduct(input: unknown): Product | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Partial<Product> & { [key: string]: unknown };

  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  if (!id || !name) return null;

  const priceNumber =
    typeof candidate.price === "number"
      ? candidate.price
      : typeof candidate.price === "string"
        ? Number(candidate.price)
        : NaN;
  const price = Number.isFinite(priceNumber) ? Math.max(0, priceNumber) : 0;

  const rawGallery = Array.isArray(candidate.gallery)
    ? candidate.gallery.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const image =
    typeof candidate.image === "string" && candidate.image.trim().length > 0
      ? candidate.image
      : (rawGallery[0] ?? "");
  if (!image) return null;

  const storage = Array.isArray(candidate.storage)
    ? Array.from(
        new Set(
          candidate.storage
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => normalizeSizeLabel(item))
            .filter((item) => item.length > 0),
        ),
      )
    : [];

  const colors = Array.isArray(candidate.colors)
    ? candidate.colors
        .filter(
          (item): item is { name: string; hex: string } =>
            !!item &&
            typeof item === "object" &&
            typeof (item as { name?: unknown }).name === "string" &&
            typeof (item as { hex?: unknown }).hex === "string",
        )
        .map((item) => ({ name: normalizeColorName(item.name), hex: item.hex }))
        .filter((item) => item.name.length > 0)
    : [];

  const highlights = Array.isArray(candidate.highlights)
    ? candidate.highlights.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  const sanitizedHighlights =
    highlights.length > 0
      ? highlights
      : ["Curated boutique catalog", "Comfort-forward fit", "Available while stock lasts"];

  const baseTagline =
    typeof candidate.tagline === "string" && candidate.tagline.trim().length > 0
      ? candidate.tagline
      : `${name} - boutique pick for your collection.`;

  const baseDescription =
    typeof candidate.description === "string" && candidate.description.trim().length > 0
      ? candidate.description
      : name;

  const derivedAttributes = deriveProductAttributes({
    name,
    tagline: baseTagline,
    description: baseDescription,
    highlights: sanitizedHighlights,
  });

  const safe: Product = {
    id,
    name,
    brand: normalizeCollection(candidate.brand),
    tagline: baseTagline,
    description: baseDescription,
    price,
    image,
    gallery: rawGallery.length > 0 ? rawGallery : [image],
    bg: typeof candidate.bg === "string" && candidate.bg.trim().length > 0 ? candidate.bg : "bg-[oklch(0.94_0.03_30)]",
    accent:
      typeof candidate.accent === "string" && candidate.accent.trim().length > 0
        ? candidate.accent
        : "text-[oklch(0.22_0.04_30)]",
    badge:
      typeof candidate.badge === "string" && candidate.badge.trim().length > 0 ? candidate.badge : undefined,
    storage: storage.length > 0 ? storage : ["S", "M", "L", "XL"],
    colors: colors.length > 0 ? colors : [{ name: "Black", hex: "#1c1c1e" }],
    highlights: sanitizedHighlights,
    attributes: derivedAttributes,
    sizeGuide: normalizeSizeGuide(candidate.sizeGuide, storage.length > 0 ? storage : ["S", "M", "L", "XL"]),
  };

  return normalizeProductImages(safe);
}

const legacyBaseProducts: Product[] = [
  {
    "id": "1-set-womens-sexy-lingerie-black-sheer-backless-bodysuit-garter-stockings-pantyh",
    "name": "1 Set Women's Sexy Lingerie Black Sheer Backless Bodysuit + Garter Stockings + Pantyhose Heart Pattern Design No Need To Remove Convenient For Play Hollow-Out Design Seductive Full Of Love Ideal For Valentine's Day",
    "brand": "Lace",
    "tagline": "1 Set Women's Sexy Lingerie Black Sheer Backless Bodysuit + Garter Stockings + Pantyhose Heart Pattern Design No Need To Remove Convenient For Play Hollow-Out Design Seductive Full Of Love Ideal For Valentine's Day - boutique pick for your collection.",
    "description": "Imported from your public catalog: 1 Set Women's Sexy Lingerie Black Sheer Backless Bodysuit + Garter Stockings + Pantyhose Heart Pattern Design No Need To Remove Convenient For Play Hollow-Out Design Seductive Full Of Love Ideal For Valentine's Day.",
    "price": 12,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/1_Set_Women_s_Sexy_Lingerie_Black_Sheer_Backless_Bodysuit_Garter_Stockings_Pantyhose_Heart_Pattern_Design_No_Need_To_Remove_Convenient_For_Play_Hollow-Out_Design_Seductive_Full_Of_Love_Ideal_For_Valentine_s_Day/1746022225321e3a921929caf887c4d4ec193805e2_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "1pc-women-sexy-lingerie-bodysuit-sexy-fishnet-cover-up-without-bikini-for-music-",
    "name": "1PC Women Sexy Lingerie Bodysuit Sexy Fishnet Cover Up Without Bikini For Music Festival Hollow Out Bodycon Dress See Through Beachwear Summer Women's Swimwear Clothing Swimsuit",
    "brand": "Lace",
    "tagline": "1PC Women Sexy Lingerie Bodysuit Sexy Fishnet Cover Up Without Bikini For Music Festival Hollow Out Bodycon Dress See Through Beachwear Summer Women's Swimwear Clothing Swimsuit - boutique pick for your collection.",
    "description": "Imported from your public catalog: 1PC Women Sexy Lingerie Bodysuit Sexy Fishnet Cover Up Without Bikini For Music Festival Hollow Out Bodycon Dress See Through Beachwear Summer Women's Swimwear Clothing Swimsuit.",
    "price": 13,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/1PC_Women_Sexy_Lingerie_Bodysuit_Sexy_Fishnet_Cover_Up_Without_Bikini_For_Music_Festival_Hollow_Out_Bodycon_Dress_See_Through_Beachwear_Summer_Women_s_Swimwear_Clothing_Swimsuit/17473763427c366c313e2b41b2c3a7fb6c654004b7_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "2-pcs-undercover-seductive-wear",
    "name": "2 PCs undercover seductive wear",
    "brand": "Lace",
    "tagline": "2 PCs undercover seductive wear - boutique pick for your collection.",
    "description": "Imported from your public catalog: 2 PCs undercover seductive wear.",
    "price": 14,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/2_PCs_undercover_seductive_wear/black/1670032236228213049aa2af646d63c3bea1ce12a8_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "Best Seller",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "2pcs-set-dark-aesthetic-sexy-lingerie-set-3pcs-women-lace-bra-and-panty-set-with",
    "name": "2pcs Set Dark Aesthetic Sexy Lingerie Set 3pcs Women Lace Bra And Panty Set With Underwire And No Padding Suitable For Outerwear Create A Bad Girl Look",
    "brand": "Lace",
    "tagline": "2pcs Set Dark Aesthetic Sexy Lingerie Set 3pcs Women Lace Bra And Panty Set With Underwire And No Padding Suitable For Outerwear Create A Bad Girl Look - boutique pick for your collection.",
    "description": "Imported from your public catalog: 2pcs Set Dark Aesthetic Sexy Lingerie Set 3pcs Women Lace Bra And Panty Set With Underwire And No Padding Suitable For Outerwear Create A Bad Girl Look.",
    "price": 15,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/2pcs_Set_Dark_Aesthetic_Sexy_Lingerie_Set_3pcs_Women_Lace_Bra_And_Panty_Set_With_Underwire_And_No_Padding_Suitable_For_Outerwear_Create_A_Bad_Girl_Look/BLACK/17563681270439f097dcfeb878a6769bc9eab21392_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "Low Stock",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "2pcs-womens-sexy-lingerie-set-lace-satin-splice-sexy-club-outfit-suitable-for-ho",
    "name": "2pcs Women's Sexy Lingerie Set Lace & Satin Splice Sexy Club Outfit Suitable For Home Holiday Party Romantic Occasions",
    "brand": "Lounge",
    "tagline": "2pcs Women's Sexy Lingerie Set Lace & Satin Splice Sexy Club Outfit Suitable For Home Holiday Party Romantic Occasions - boutique pick for your collection.",
    "description": "Imported from your public catalog: 2pcs Women's Sexy Lingerie Set Lace & Satin Splice Sexy Club Outfit Suitable For Home Holiday Party Romantic Occasions.",
    "price": 16,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/2pcs_Women_s_Sexy_Lingerie_Set_Lace_Satin_Splice_Sexy_Club_Outfit_Suitable_For_Home_Holiday_Party_Romantic_Occasions/1749515992f90a09684a2558430f3c4ce6906325ae_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "3pcs-sexy-lingerie-set-for-women-with-underwire-bra-g-string-and-mini-skirt",
    "name": "3pcs Sexy Lingerie Set For Women (With Underwire Bra G-String And Mini Skirt)",
    "brand": "Lace",
    "tagline": "3pcs Sexy Lingerie Set For Women (With Underwire Bra G-String And Mini Skirt) - boutique pick for your collection.",
    "description": "Imported from your public catalog: 3pcs Sexy Lingerie Set For Women (With Underwire Bra G-String And Mini Skirt).",
    "price": 17,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/3pcs_Sexy_Lingerie_Set_For_Women_With_Underwire_Bra_G-String_And_Mini_Skirt/17674949420ceba769f5d12919145a03aaf886f17f_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "3pcs-womens-black-sexy-patent-leather-metallic-strap-halloween-costume-mesh-slit",
    "name": "3pcs Women's Black Sexy Patent Leather Metallic Strap Halloween Costume Mesh Slit Maxi Dress Lingerie Set Suitable For Home Private Party Or Nightclub Wear Sexy Lingerie",
    "brand": "Lace",
    "tagline": "3pcs Women's Black Sexy Patent Leather Metallic Strap Halloween Costume Mesh Slit Maxi Dress Lingerie Set Suitable For Home Private Party Or Nightclub Wear Sexy Lingerie - boutique pick for your collection.",
    "description": "Imported from your public catalog: 3pcs Women's Black Sexy Patent Leather Metallic Strap Halloween Costume Mesh Slit Maxi Dress Lingerie Set Suitable For Home Private Party Or Nightclub Wear Sexy Lingerie.",
    "price": 12,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/3pcs_Women_s_Black_Sexy_Patent_Leather_Metallic_Strap_Halloween_Costume_Mesh_Slit_Maxi_Dress_Lingerie_Set_Suitable_For_Home_Private_Party_Or_Nightclub_Wear_Sexy_Lingerie/175394207917e55770b830b744c9600e556222f67e_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "3pcs-womens-sexy-lingerie-set-front-hook-34-cup-bra-with-adjustable-straps-and-m",
    "name": "3pcs Women's Sexy Lingerie Set Front Hook 34 Cup Bra With Adjustable Straps And Metal Chain Decor Adjustable Garter Belt And Sexy Thong. Lace Accents Comfortable Lingerie Set Suitable For Elegant Occ",
    "brand": "Lace",
    "tagline": "3pcs Women's Sexy Lingerie Set Front Hook 34 Cup Bra With Adjustable Straps And Metal Chain Decor Adjustable Garter Belt And Sexy Thong. Lace Accents Comfortable Lingerie Set Suitable For Elegant Occ - boutique pick for your collection.",
    "description": "Imported from your public catalog: 3pcs Women's Sexy Lingerie Set Front Hook 34 Cup Bra With Adjustable Straps And Metal Chain Decor Adjustable Garter Belt And Sexy Thong. Lace Accents Comfortable Lingerie Set Suitable For Elegant Occ.",
    "price": 13,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/3pcs_Women_s_Sexy_Lingerie_Set_Front_Hook_34_Cup_Bra_With_Adjustable_Straps_And_Metal_Chain_Decor_Adjustable_Garter_Belt_And_Sexy_Thong._Lace_Accents_Comfortable_Lingerie_Set_Suitable_For_Elegant_Occ/BLACK/1749092202370a3138523fb21387aa45fc44fe91c2_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "4pcs-mature-series-lace-patchwork-underwire-bodycon-dress-set",
    "name": "4pcs Mature Series Lace Patchwork Underwire Bodycon Dress Set",
    "brand": "Lace",
    "tagline": "4pcs Mature Series Lace Patchwork Underwire Bodycon Dress Set - boutique pick for your collection.",
    "description": "Imported from your public catalog: 4pcs Mature Series Lace Patchwork Underwire Bodycon Dress Set.",
    "price": 14,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/4pcs_Mature_Series_Lace_Patchwork_Underwire_Bodycon_Dress_Set/black/172871697512cbf3ccaaaeca9aa85fd76df226d34d_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "4pcs-womens-punk-style-choker-with-spaghetti-strap-garter-belt-leg-ring-and-sexy",
    "name": "4pcs Women's Punk Style Choker With Spaghetti Strap Garter Belt & Leg Ring And Sexy Ruffle Dress Set Lingerie",
    "brand": "Lace",
    "tagline": "4pcs Women's Punk Style Choker With Spaghetti Strap Garter Belt & Leg Ring And Sexy Ruffle Dress Set Lingerie - boutique pick for your collection.",
    "description": "Imported from your public catalog: 4pcs Women's Punk Style Choker With Spaghetti Strap Garter Belt & Leg Ring And Sexy Ruffle Dress Set Lingerie.",
    "price": 15,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/4pcs_Women_s_Punk_Style_Choker_With_Spaghetti_Strap_Garter_Belt_Leg_Ring_And_Sexy_Ruffle_Dress_Set_Lingerie/171806864869c8f8a5884cac96640e41d515763e15_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "chasethenight-2pcs-women-sexy-mesh-lingerie-set-for-going-out-lingerie-for-women",
    "name": "ChaseTheNight 2pcs Women Sexy Mesh Lingerie Set For Going Out Lingerie For Women Sexy Valentine's Day Sexy Lingerie",
    "brand": "Lace",
    "tagline": "ChaseTheNight 2pcs Women Sexy Mesh Lingerie Set For Going Out Lingerie For Women Sexy Valentine's Day Sexy Lingerie - boutique pick for your collection.",
    "description": "Imported from your public catalog: ChaseTheNight 2pcs Women Sexy Mesh Lingerie Set For Going Out Lingerie For Women Sexy Valentine's Day Sexy Lingerie.",
    "price": 16,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/ChaseTheNight_2pcs_Women_Sexy_Mesh_Lingerie_Set_For_Going_Out_Lingerie_For_Women_Sexy_Valentine_s_Day_Sexy_Lingerie/black/17418625425253c235d0e4b40efad744effd139943_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "crystal-vow-hollow-out-scallop-trim-lace-panty-lingerie-bridallingerie",
    "name": "Crystal Vow Hollow Out Scallop Trim Lace Panty Lingerie Bridallingerie",
    "brand": "Lace",
    "tagline": "Crystal Vow Hollow Out Scallop Trim Lace Panty Lingerie Bridallingerie - boutique pick for your collection.",
    "description": "Imported from your public catalog: Crystal Vow Hollow Out Scallop Trim Lace Panty Lingerie Bridallingerie.",
    "price": 17,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Crystal_Vow_Hollow_Out_Scallop_Trim_Lace_Panty_Lingerie_Bridallingerie/black/1703813861e16c7eb32332f898e2e429b76ebebe7b_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "empressenvy-womens-classic-sexy-black-lace-semi-sheer-babydoll-with-cut-out-deta",
    "name": "EmpressEnvy Women's Classic Sexy Black Lace Semi Sheer Babydoll With Cut Out Details And Spaghetti Strap Short Length Lingerie Set Baddie Look",
    "brand": "Lace",
    "tagline": "EmpressEnvy Women's Classic Sexy Black Lace Semi Sheer Babydoll With Cut Out Details And Spaghetti Strap Short Length Lingerie Set Baddie Look - boutique pick for your collection.",
    "description": "Imported from your public catalog: EmpressEnvy Women's Classic Sexy Black Lace Semi Sheer Babydoll With Cut Out Details And Spaghetti Strap Short Length Lingerie Set Baddie Look.",
    "price": 12,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/EmpressEnvy_Women_s_Classic_Sexy_Black_Lace_Semi_Sheer_Babydoll_With_Cut_Out_Details_And_Spaghetti_Strap_Short_Length_Lingerie_Set_Baddie_Look/black/1772607749b43cdb6d086c5696a54df4ecae69474a_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "floral-underwire-puff-sleeve-lace-patchwork-top-thong-skirt-3pcs-set-bridal-ling",
    "name": "Floral Underwire Puff Sleeve Lace Patchwork Top + Thong + Skirt 3pcs Set Bridal Lingerie Set Going Out",
    "brand": "Lace",
    "tagline": "Floral Underwire Puff Sleeve Lace Patchwork Top + Thong + Skirt 3pcs Set Bridal Lingerie Set Going Out - boutique pick for your collection.",
    "description": "Imported from your public catalog: Floral Underwire Puff Sleeve Lace Patchwork Top + Thong + Skirt 3pcs Set Bridal Lingerie Set Going Out.",
    "price": 13,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Floral_Underwire_Puff_Sleeve_Lace_Patchwork_Top_Thong_Skirt_3pcs_Set_Bridal_Lingerie_Set_Going_Out/17200713865ac2497ceedd0dd6e15d95e15ea798a9_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "hollow-out-leopard-print-wrap-around-sexy-lingerie-for-going-out",
    "name": "Hollow Out Leopard Print Wrap-Around Sexy Lingerie For Going Out",
    "brand": "Lace",
    "tagline": "Hollow Out Leopard Print Wrap-Around Sexy Lingerie For Going Out - boutique pick for your collection.",
    "description": "Imported from your public catalog: Hollow Out Leopard Print Wrap-Around Sexy Lingerie For Going Out.",
    "price": 14,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Hollow_Out_Leopard_Print_Wrap-Around_Sexy_Lingerie_For_Going_Out/172135882235d10006bbb27007f4fd4e5a03da08b9_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "ladies-sexy-pu-leather-backless-halter-neck-lingerie-dress",
    "name": "Ladies' Sexy Pu Leather Backless Halter Neck Lingerie Dress",
    "brand": "Lace",
    "tagline": "Ladies' Sexy Pu Leather Backless Halter Neck Lingerie Dress - boutique pick for your collection.",
    "description": "Imported from your public catalog: Ladies' Sexy Pu Leather Backless Halter Neck Lingerie Dress.",
    "price": 15,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Ladies_Sexy_Pu_Leather_Backless_Halter_Neck_Lingerie_Dress/1733913680dd2435df435fdf12e33eb3bbd6dd44b9_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "plus-size-lingerie-hollow-out-cover-up-sheer-solid-color-high-elasticity-lace-dr",
    "name": "Plus Size Lingerie Hollow Out Cover-Up Sheer Solid Color High Elasticity Lace Dress",
    "brand": "Lace",
    "tagline": "Plus Size Lingerie Hollow Out Cover-Up Sheer Solid Color High Elasticity Lace Dress - boutique pick for your collection.",
    "description": "Imported from your public catalog: Plus Size Lingerie Hollow Out Cover-Up Sheer Solid Color High Elasticity Lace Dress.",
    "price": 16,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Plus_Size_Lingerie_Hollow_Out_Cover-Up_Sheer_Solid_Color_High_Elasticity_Lace_Dress/black/172319711197d8b2c0bee3cb51cc4b46ad769849ef_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "seduluxe-1pc-lace-front-closure-wireless-bra-for-women",
    "name": "Seduluxe 1pc Lace Front Closure Wireless Bra For Women",
    "brand": "Lace",
    "tagline": "Seduluxe 1pc Lace Front Closure Wireless Bra For Women - boutique pick for your collection.",
    "description": "Imported from your public catalog: Seduluxe 1pc Lace Front Closure Wireless Bra For Women.",
    "price": 17,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Seduluxe_1pc_Lace_Front_Closure_Wireless_Bra_For_Women/17665634013ea16b4f7e41bd4b5453a812e2821723_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "sleeveless-sexy-bandage-dress-elegant-black-white-round-neck-long-fitted-design-",
    "name": "Sleeveless Sexy Bandage Dress - Elegant Black & White Round Neck Long Fitted Design - Slit Hem Tie Detail Suitable For Summer Party & Evening Wear",
    "brand": "Lace",
    "tagline": "Sleeveless Sexy Bandage Dress - Elegant Black & White Round Neck Long Fitted Design - Slit Hem Tie Detail Suitable For Summer Party & Evening Wear - boutique pick for your collection.",
    "description": "Imported from your public catalog: Sleeveless Sexy Bandage Dress - Elegant Black & White Round Neck Long Fitted Design - Slit Hem Tie Detail Suitable For Summer Party & Evening Wear.",
    "price": 12,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Sleeveless_Sexy_Bandage_Dress_-_Elegant_Black_White_Round_Neck_Long_Fitted_Design_-_Slit_Hem_Tie_Detail_Suitable_For_Summer_Party_Evening_Wear/1740214819109aa8bb843d14d0635e1cdfd731200c_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "solid-color-hollow-out-mesh-bra-and-triangle-underwear-sexy-lingerie-set-2pcs-fo",
    "name": "Solid Color Hollow Out Mesh Bra And Triangle Underwear Sexy Lingerie Set 2pcs. For Going Out",
    "brand": "Lace",
    "tagline": "Solid Color Hollow Out Mesh Bra And Triangle Underwear Sexy Lingerie Set 2pcs. For Going Out - boutique pick for your collection.",
    "description": "Imported from your public catalog: Solid Color Hollow Out Mesh Bra And Triangle Underwear Sexy Lingerie Set 2pcs. For Going Out.",
    "price": 13,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Solid_Color_Hollow_Out_Mesh_Bra_And_Triangle_Underwear_Sexy_Lingerie_Set_2pcs._For_Going_Out/17183471834525119197fbde4123ff4d5bb4ffc2b7_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "sxy-commute-minimalist-office-old-money-simple-womens-striped-hollow-out-patchwo",
    "name": "SXY Commute Minimalist Office Old Money Simple Women's Striped Hollow Out Patchwork Skinny Leggings Everyday Casual Wear",
    "brand": "Everyday",
    "tagline": "SXY Commute Minimalist Office Old Money Simple Women's Striped Hollow Out Patchwork Skinny Leggings Everyday Casual Wear - boutique pick for your collection.",
    "description": "Imported from your public catalog: SXY Commute Minimalist Office Old Money Simple Women's Striped Hollow Out Patchwork Skinny Leggings Everyday Casual Wear.",
    "price": 14,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/SXY_Commute_Minimalist_Office_Old_Money_Simple_Women_s_Striped_Hollow_Out_Patchwork_Skinny_Leggings_Everyday_Casual_Wear/BLACK/170548244174619fb6b70dd4cabf6561ab0a7fca7a_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "womens-fashionable-tie-dye-slim-flared-long-pants",
    "name": "Women's Fashionable Tie Dye Slim Flared Long Pants",
    "brand": "Everyday",
    "tagline": "Women's Fashionable Tie Dye Slim Flared Long Pants - boutique pick for your collection.",
    "description": "Imported from your public catalog: Women's Fashionable Tie Dye Slim Flared Long Pants.",
    "price": 15,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Women_s_Fashionable_Tie_Dye_Slim_Flared_Long_Pants/17114260010f674ff4cd464a34df19efdabc46a7e8_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "womens-high-waist-solid-color-flare-yoga-leggings-workout-running-fitness-pants-",
    "name": "Women's High Waist Solid Color Flare Yoga Leggings Workout Running Fitness Pants Black Spring",
    "brand": "Everyday",
    "tagline": "Women's High Waist Solid Color Flare Yoga Leggings Workout Running Fitness Pants Black Spring - boutique pick for your collection.",
    "description": "Imported from your public catalog: Women's High Waist Solid Color Flare Yoga Leggings Workout Running Fitness Pants Black Spring.",
    "price": 16,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Women_s_High_Waist_Solid_Color_Flare_Yoga_Leggings_Workout_Running_Fitness_Pants_Black_Spring/black/174408129146654656e74be917ca457b3eebbb0aec_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "womens-solid-color-halter-lace-sexy-bra-and-panty-set",
    "name": "Women's Solid Color Halter Lace Sexy Bra And Panty Set",
    "brand": "Lace",
    "tagline": "Women's Solid Color Halter Lace Sexy Bra And Panty Set - boutique pick for your collection.",
    "description": "Imported from your public catalog: Women's Solid Color Halter Lace Sexy Bra And Panty Set.",
    "price": 17,
    "image": "https://feakfahndsbslsmhhczy.supabase.co/storage/v1/object/public/product-images/Women_s_Solid_Color_Halter_Lace_Sexy_Bra_And_Panty_Set/17008956254cfda8afcbc659e4bcb1348649747124_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  }
];

const generatedBaseProducts = publicGeneratedProducts
  .map((product) => sanitizeProduct(product))
  .filter((product): product is Product => !!product);

export const baseProducts: Product[] = generatedBaseProducts;

for (let i = 0; i < baseProducts.length; i++) {
  baseProducts[i] = normalizeProductImages(baseProducts[i]);
}

const CUSTOM_PRODUCTS_KEY = "loftie-custom-products-v1";
const PENDING_IDS_KEY = "loftie-pending-product-ids-v1";
const DELETED_IDS_KEY = "loftie-deleted-product-ids-v1";
type ProductsListener = () => void;
const productListeners = new Set<ProductsListener>();
let cachedCustomProductsRaw: string | null | undefined;
let cachedCustomProducts: Product[] = [];
let cachedMergedCustomRef: Product[] | null = null;
let cachedMergedProducts: Product[] = baseProducts;
let pendingIds: Set<string> = loadIdSet(PENDING_IDS_KEY);
let pendingDeletes: Set<string> = loadIdSet(DELETED_IDS_KEY);
let realtimeChannel: { unsubscribe: () => void } | null = null;
let lastFetchPromise: Promise<Product[]> | null = null;

function loadIdSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function saveIdSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
}

function markPending(id: string) {
  pendingIds.add(id);
  saveIdSet(PENDING_IDS_KEY, pendingIds);
}

function clearPending(id: string) {
  if (pendingIds.delete(id)) saveIdSet(PENDING_IDS_KEY, pendingIds);
}

function markPendingDelete(id: string) {
  pendingDeletes.add(id);
  saveIdSet(DELETED_IDS_KEY, pendingDeletes);
}

function clearPendingDelete(id: string) {
  if (pendingDeletes.delete(id)) saveIdSet(DELETED_IDS_KEY, pendingDeletes);
}


function readCustomProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    if (raw === cachedCustomProductsRaw) return cachedCustomProducts;
    if (!raw) {
      cachedCustomProductsRaw = raw;
      cachedCustomProducts = [];
      return cachedCustomProducts;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      cachedCustomProductsRaw = raw;
      cachedCustomProducts = [];
      return cachedCustomProducts;
    }
    cachedCustomProductsRaw = raw;
    cachedCustomProducts = parsed.map(sanitizeProduct).filter((item): item is Product => !!item);
    return cachedCustomProducts;
  } catch {
    cachedCustomProductsRaw = null;
    cachedCustomProducts = [];
    return [];
  }
}

function writeCustomProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(products);
  localStorage.setItem(CUSTOM_PRODUCTS_KEY, serialized);
  cachedCustomProductsRaw = serialized;
  cachedCustomProducts = products;
}

function notifyProductsChanged() {
  productListeners.forEach((listener) => listener());
}

export function subscribeProducts(listener: ProductsListener): () => void {
  productListeners.add(listener);
  return () => {
    productListeners.delete(listener);
  };
}

export function getProducts(): Product[] {
  const customProducts = readCustomProducts();
  if (customProducts.length === 0) return baseProducts;
  if (cachedMergedCustomRef === customProducts) return cachedMergedProducts;
  cachedMergedCustomRef = customProducts;
  cachedMergedProducts = [
    ...customProducts,
    ...baseProducts.filter((p) => !customProducts.some((c) => c.id === p.id)),
  ];
  return cachedMergedProducts;
}

export function getServerProducts(): Product[] {
  return baseProducts;
}

export async function createCustomProduct(input: {
  name: string;
  brand: Collection;
  price: number;
  image: string;
  gallery?: string[];
  tagline?: string;
  description?: string;
  badge?: string;
  colors?: { name: string; hex: string }[];
  storage?: string[];
  highlights?: string[];
  sizeGuide?: ProductSizeGuide;
}): Promise<Product> {
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 84);

  const id = `${slug}-${Date.now().toString().slice(-6)}`;
  const next: Product = {
    id,
    name: input.name,
    brand: input.brand,
    price: input.price,
    image: input.image,
    gallery: input.gallery && input.gallery.length > 0 ? input.gallery : [input.image],
    tagline: input.tagline?.trim() || `${input.name} - new arrival from admin catalog.`,
    description: input.description?.trim() || input.name,
    badge: input.badge?.trim() || "New",
    storage: input.storage && input.storage.length > 0 ? input.storage : ["S", "M", "L", "XL"],
    colors: input.colors && input.colors.length > 0 ? input.colors : [{ name: "Black", hex: "#1c1c1e" }],
    highlights: input.highlights && input.highlights.length > 0 ? input.highlights : [
      "Added from admin panel",
      "Limited availability",
      "Curated boutique catalog",
    ],
    sizeGuide: input.sizeGuide ?? getDefaultSizeGuide(input.storage && input.storage.length > 0 ? input.storage : ["S", "M", "L", "XL"]),
    bg: "bg-[oklch(0.94_0.03_30)]",
    accent: "text-[oklch(0.22_0.04_30)]",
  };
  const normalizedNext = normalizeProductImages(next);

  const customProducts = readCustomProducts();
  writeCustomProducts([normalizedNext, ...customProducts]);
  markPending(normalizedNext.id);
  notifyProductsChanged();

  const client = getOptionalSupabase();
  if (client) {
    const { error } = await client.from("products").upsert({
      id: next.id,
      name: next.name,
      brand: next.brand,
      price: next.price,
      image: normalizedNext.image,
      is_published: true,
      payload: normalizedNext,
    });
    if (!error) {
      clearPending(normalizedNext.id);
    }
  }

  return normalizedNext;
}

export function getCustomProducts(): Product[] {
  return readCustomProducts();
}

export function hasPendingSync(id: string): boolean {
  return pendingIds.has(id) || pendingDeletes.has(id);
}

export function getPendingProductIds(): string[] {
  return Array.from(pendingIds);
}

export async function updateCustomProduct(
  id: string,
  input: {
    name: string;
    brand: Collection;
    price: number;
    image: string;
    gallery?: string[];
    tagline?: string;
    description?: string;
    badge?: string;
    colors?: { name: string; hex: string }[];
    storage?: string[];
    highlights?: string[];
    sizeGuide?: ProductSizeGuide;
  },
): Promise<Product> {
  const customProducts = readCustomProducts();
  const index = customProducts.findIndex((p) => p.id === id);

  // Support editing base products: if not in customProducts yet, look in baseProducts
  const prev = index >= 0 ? customProducts[index] : baseProducts.find((p) => p.id === id);
  if (!prev) throw new Error(`Product not found: ${id}`);

  const next: Product = {
    ...prev,
    id,
    name: input.name,
    brand: input.brand,
    price: input.price,
    image: input.image,
    gallery: input.gallery && input.gallery.length > 0 ? input.gallery : [input.image],
    tagline: input.tagline?.trim() || `${input.name} - updated from admin catalog.`,
    description: input.description?.trim() || input.name,
    badge: input.badge?.trim() || prev.badge || "New",
    storage: input.storage && input.storage.length > 0 ? input.storage : prev.storage,
    colors: input.colors && input.colors.length > 0 ? input.colors : prev.colors,
    highlights: input.highlights && input.highlights.length > 0 ? input.highlights : prev.highlights,
    sizeGuide: input.sizeGuide ?? prev.sizeGuide ?? getDefaultSizeGuide(prev.storage),
  };
  const normalizedNext = normalizeProductImages(next);

  if (index >= 0) {
    const updated = [...customProducts];
    updated[index] = normalizedNext;
    writeCustomProducts(updated);
  } else {
    // Base product promoted to custom — prepend so it overrides the base entry
    writeCustomProducts([normalizedNext, ...customProducts]);
  }
  markPending(normalizedNext.id);
  notifyProductsChanged();

  const client = getOptionalSupabase();
  if (client) {
    const { error } = await client
      .from("products")
      .upsert({
        id: normalizedNext.id,
        name: normalizedNext.name,
        brand: normalizedNext.brand,
        price: normalizedNext.price,
        image: normalizedNext.image,
        is_published: true,
        payload: normalizedNext,
      });
    if (!error) {
      clearPending(normalizedNext.id);
    }
  }

  return normalizedNext;
}

export async function deleteCustomProduct(id: string): Promise<boolean> {
  const customProducts = readCustomProducts();
  const existedLocally = customProducts.some((p) => p.id === id);
  const existedInBase = baseProducts.some((p) => p.id === id);
  if (!existedLocally && !existedInBase) return false;

  const remaining = customProducts.filter((p) => p.id !== id);
  writeCustomProducts(remaining);
  clearPending(id);
  markPendingDelete(id);
  notifyProductsChanged();

  const client = getOptionalSupabase();
  if (client) {
    const { error } = await client.from("products").delete().eq("id", id);
    if (!error) {
      clearPendingDelete(id);
    }
  }

  return true;
}

export async function fetchCustomProducts(): Promise<Product[]> {
  if (lastFetchPromise) return lastFetchPromise;

  const client = getOptionalSupabase();
  if (!client) return readCustomProducts();

  lastFetchPromise = (async () => {
    try {
      const { data, error } = await client
        .from("products")
        .select("payload, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false });

      if (error || !data) return readCustomProducts();

      const remote = data
        .map((row) => sanitizeProduct(row?.payload))
        .filter((item): item is Product => !!item);

      const local = readCustomProducts();

      // Cloud is source of truth. Only keep local entries that are unsynced
      // pending writes — those overwrite the cloud copy until they sync.
      const mergedById = new Map<string, Product>();
      for (const product of remote) {
        if (pendingDeletes.has(product.id)) continue;
        mergedById.set(product.id, product);
      }
      for (const product of local) {
        if (pendingIds.has(product.id)) mergedById.set(product.id, product);
      }

      const merged = Array.from(mergedById.values());
      writeCustomProducts(merged);
      notifyProductsChanged();
      return merged;
    } catch {
      return readCustomProducts();
    } finally {
      // Allow the next call to refetch (debounce window so concurrent callers share).
      setTimeout(() => {
        lastFetchPromise = null;
      }, 50);
    }
  })();

  return lastFetchPromise;
}

export const products: Product[] = getProducts();

export const getProduct = (id: string) => getProducts().find((p) => p.id === id);

export async function fetchProductById(id: string): Promise<Product | null> {
  const local = getProduct(id);
  if (local) return local;

  const client = getOptionalSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("products")
      .select("payload")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) return null;
    const product = sanitizeProduct(data.payload);
    if (!product) return null;

    // Hydrate the local cache so subsequent reads are instant.
    const existing = readCustomProducts();
    const next = [product, ...existing.filter((p) => p.id !== product.id)];
    writeCustomProducts(next);
    notifyProductsChanged();
    return product;
  } catch {
    return null;
  }
}

export async function ensureProductsLoaded(): Promise<Product[]> {
  return fetchCustomProducts();
}

export function subscribeProductsRealtime(): () => void {
  if (typeof window === "undefined") return () => {};
  if (realtimeChannel) return () => {};

  const client = getOptionalSupabase();
  if (!client) return () => {};

  try {
    const channel = client
      .channel("products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          // Any change in the products table → refresh the cache.
          // The debounce inside fetchCustomProducts coalesces bursts.
          void fetchCustomProducts();
        },
      )
      .subscribe();

    realtimeChannel = {
      unsubscribe: () => {
        try {
          client.removeChannel(channel);
        } catch {
          /* noop */
        }
        realtimeChannel = null;
      },
    };

    return () => realtimeChannel?.unsubscribe();
  } catch {
    return () => {};
  }
}

// Retry any pending writes that failed to sync on previous attempts.
export async function flushPendingWrites(): Promise<void> {
  if (pendingIds.size === 0 && pendingDeletes.size === 0) return;
  const client = getOptionalSupabase();
  if (!client) return;

  const local = readCustomProducts();
  const byId = new Map(local.map((p) => [p.id, p]));

  for (const id of Array.from(pendingIds)) {
    const product = byId.get(id);
    if (!product) {
      clearPending(id);
      continue;
    }
    try {
      const { error } = await client.from("products").upsert({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        is_published: true,
        payload: product,
      });
      if (!error) clearPending(id);
    } catch {
      /* keep pending, retry next time */
    }
  }

  for (const id of Array.from(pendingDeletes)) {
    try {
      const { error } = await client.from("products").delete().eq("id", id);
      if (!error) {
        clearPendingDelete(id);
        const remaining = readCustomProducts().filter((p) => p.id !== id);
        writeCustomProducts(remaining);
        notifyProductsChanged();
      }
    } catch {
      /* keep pending */
    }
  }
}
