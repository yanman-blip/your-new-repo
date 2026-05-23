import { getOptionalSupabase } from "@/integrations/supabase/optional-client";

export type ProductReviewFit = "True to size" | "Small" | "Large";

export type ProductReviewRecord = {
  id: string;
  productId: string;
  reviewerName: string;
  rating: number;
  fit: ProductReviewFit;
  sizeLabel: string;
  reviewText: string;
  photos: string[];
  helpfulCount: number;
  verifiedPurchase: boolean;
  createdAt: string;
};

export type CreateProductReviewInput = {
  productId: string;
  reviewerName: string;
  rating: number;
  fit: ProductReviewFit;
  sizeLabel: string;
  reviewText: string;
  photos: string[];
};

const LOCAL_REVIEW_KEY = "wet-lace-local-reviews-v1";

type LocalReviewPayload = Record<string, ProductReviewRecord[]>;

function normalizePhotos(photos: string[]): string[] {
  const unique = new Set<string>();
  for (const raw of photos) {
    const value = raw.trim();
    if (!value) continue;
    unique.add(value);
    if (unique.size >= 6) break;
  }
  return Array.from(unique);
}

function readLocalReviews(): LocalReviewPayload {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_REVIEW_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalReviewPayload;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalReviews(store: LocalReviewPayload) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_REVIEW_KEY, JSON.stringify(store));
  } catch {
    // Ignore local storage failures.
  }
}

function toRecord(row: {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  fit: string;
  size_label: string;
  review_text: string;
  photos: unknown;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
}): ProductReviewRecord {
  const fit = (row.fit === "Small" || row.fit === "Large" || row.fit === "True to size")
    ? row.fit
    : "True to size";

  return {
    id: row.id,
    productId: row.product_id,
    reviewerName: row.reviewer_name,
    rating: row.rating,
    fit,
    sizeLabel: row.size_label,
    reviewText: row.review_text,
    photos: Array.isArray(row.photos) ? row.photos.filter((item): item is string => typeof item === "string") : [],
    helpfulCount: row.helpful_count,
    verifiedPurchase: row.verified_purchase,
    createdAt: row.created_at,
  };
}

export async function fetchProductReviews(productId: string): Promise<ProductReviewRecord[]> {
  const local = readLocalReviews()[productId] ?? [];
  const client = getOptionalSupabase();
  if (!client) return local;

  try {
    const { data, error } = await client
      .from("product_reviews")
      .select("id, product_id, reviewer_name, rating, fit, size_label, review_text, photos, helpful_count, verified_purchase, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error || !data) return local;

    const remote = data.map((row) => toRecord(row));
    if (local.length === 0) return remote;

    const known = new Set(remote.map((review) => review.id));
    const localOnly = local.filter((review) => !known.has(review.id));
    return [...remote, ...localOnly];
  } catch {
    return local;
  }
}

export async function createProductReview(input: CreateProductReviewInput): Promise<ProductReviewRecord> {
  const payload: ProductReviewRecord = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: input.productId,
    reviewerName: input.reviewerName.trim(),
    rating: Math.max(1, Math.min(5, input.rating)),
    fit: input.fit,
    sizeLabel: input.sizeLabel.trim(),
    reviewText: input.reviewText.trim(),
    photos: normalizePhotos(input.photos),
    helpfulCount: 0,
    verifiedPurchase: false,
    createdAt: new Date().toISOString(),
  };

  const client = getOptionalSupabase();
  if (client) {
    try {
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData?.session?.user?.id ?? null;

      const { data, error } = await client
        .from("product_reviews")
        .insert({
          product_id: payload.productId,
          reviewer_name: payload.reviewerName,
          rating: payload.rating,
          fit: payload.fit,
          size_label: payload.sizeLabel,
          review_text: payload.reviewText,
          photos: payload.photos,
          helpful_count: 0,
          verified_purchase: false,
          created_by: userId,
        })
        .select("id, product_id, reviewer_name, rating, fit, size_label, review_text, photos, helpful_count, verified_purchase, created_at")
        .single();

      if (!error && data) {
        return toRecord(data);
      }
    } catch {
      // Fall through to local fallback.
    }
  }

  const store = readLocalReviews();
  const list = store[payload.productId] ?? [];
  store[payload.productId] = [payload, ...list];
  writeLocalReviews(store);
  return payload;
}
