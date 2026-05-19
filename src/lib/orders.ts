import { getOptionalSupabase } from "@/integrations/supabase/optional-client";
import type { CartItem } from "@/lib/cart";

export class OrderConstraintError extends Error {
  readonly kind: "duplicate_proof" | "invalid_status_transition" | "unknown";
  constructor(kind: OrderConstraintError["kind"], message: string) {
    super(message);
    this.name = "OrderConstraintError";
    this.kind = kind;
  }
}

function classifyDbError(err: { code?: string; message?: string } | null | undefined): OrderConstraintError | null {
  if (!err) return null;
  const code = err.code ?? "";
  const message = err.message ?? "";
  if (code === "23505" && /proof_file_name/i.test(message)) {
    return new OrderConstraintError(
      "duplicate_proof",
      "This payment proof has already been used on another order.",
    );
  }
  if (code === "23514" || /Invalid order status transition/i.test(message)) {
    return new OrderConstraintError(
      "invalid_status_transition",
      message || "That status change isn't allowed from the order's current state.",
    );
  }
  return null;
}

export type PaymentMethodId = "ecocash" | "innbucks" | "mukuru" | "bank-transfer" | "cash-on-delivery";

export type OrderWorkflowStatus =
  | "draft"
  | "order_placed"
  | "awaiting_proof"
  | "awaiting_admin_approval"
  | "awaiting_delivery_payment"
  | "paid";

export type StoredOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderWorkflowStatus;
  paymentMethod: PaymentMethodId;
  fulfillment: "collect" | "delivery";
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  proofFileName?: string;
  proofFileUrl?: string;
  proofStoragePath?: string;
  items: CartItem[];
  customer: {
    location: string;
    firstName: string;
    lastName: string;
    phoneCode: string;
    phone: string;
    street: string;
    complex: string;
    province: string;
    city: string;
    suburb: string;
    postalCode: string;
    idType: string;
    idNumber: string;
    makeDefault: boolean;
    notes: string;
  };
};

const ORDERS_STORAGE_KEY = "loftie-orders-v1";

function readLocalOrders(): StoredOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredOrder[];
  } catch {
    return [];
  }
}

function writeLocalOrders(orders: StoredOrder[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

function upsertLocalOrder(order: StoredOrder) {
  const orders = readLocalOrders();
  const existingIndex = orders.findIndex((o) => o.id === order.id);
  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.unshift(order);
  }
  writeLocalOrders(orders);
}

function makeOrderId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type OrderRowProjection = {
  payload: unknown;
  proof_file_name?: string | null;
};

function mapStoredOrder(row: OrderRowProjection | null | undefined): StoredOrder | null {
  if (!row) return null;
  const payload = row.payload as StoredOrder | null;
  if (!payload || typeof payload !== "object") return null;

  return {
    ...payload,
    proofFileName: payload.proofFileName ?? row.proof_file_name ?? undefined,
  };
}

async function fetchRemoteOrderById(orderId: string): Promise<StoredOrder | null> {
  const client = getOptionalSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("orders")
      .select("payload, proof_file_name")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) return null;
    return mapStoredOrder(data);
  } catch {
    return null;
  }
}

export async function createOrderRecord(input: Omit<StoredOrder, "id" | "createdAt" | "updatedAt">): Promise<StoredOrder> {
  const now = new Date().toISOString();
  const order: StoredOrder = {
    id: makeOrderId(),
    createdAt: now,
    updatedAt: now,
    ...input,
  };

  upsertLocalOrder(order);

  const client = getOptionalSupabase();
  if (!client) return order;

  try {
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData?.session?.user?.id ?? null;

    const { error } = await client.from("orders").insert({
      id: order.id,
      user_id: userId,
      status: order.status,
      payment_method: order.paymentMethod,
      fulfillment: order.fulfillment,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      tax: order.tax,
      total: order.total,
      proof_file_name: order.proofFileName ?? null,
      payload: order,
    });
    const classified = classifyDbError(error);
    if (classified) throw classified;
    // Other DB errors (connectivity, RLS) → keep local copy and stay silent.
  } catch (err) {
    if (err instanceof OrderConstraintError) throw err;
    // Graceful fallback: order is still persisted locally.
  }

  return order;
}

export async function updateOrderRecord(orderId: string, patch: Partial<StoredOrder>): Promise<StoredOrder | null> {
  const orders = readLocalOrders();
  const existing = orders.find((o) => o.id === orderId) ?? (await fetchRemoteOrderById(orderId));
  if (!existing) return null;

  const next: StoredOrder = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
    customer: {
      ...existing.customer,
      ...(patch.customer ?? {}),
    },
  };

  upsertLocalOrder(next);

  const client = getOptionalSupabase();
  if (client) {
    try {
      const { error } = await client
        .from("orders")
        .update({
          status: next.status,
          payment_method: next.paymentMethod,
          fulfillment: next.fulfillment,
          subtotal: next.subtotal,
          delivery_fee: next.deliveryFee,
          tax: next.tax,
          total: next.total,
          proof_file_name: next.proofFileName ?? null,
          payload: next,
          updated_at: next.updatedAt,
        })
        .eq("id", orderId);
      const classified = classifyDbError(error);
      if (classified) {
        // Roll the local cache back so the UI shows what's actually true.
        upsertLocalOrder(existing);
        throw classified;
      }
    } catch (err) {
      if (err instanceof OrderConstraintError) throw err;
      // Keep local record as source of truth when DB is not ready.
    }
  }

  return next;
}

export function getLocalOrders(): StoredOrder[] {
  return readLocalOrders();
}

export async function fetchOrders(): Promise<StoredOrder[]> {
  const client = getOptionalSupabase();
  if (!client) return readLocalOrders();

  try {
    const { data, error } = await client
      .from("orders")
      .select("payload, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) return readLocalOrders();

    const mapped = data
      .map(mapStoredOrder)
      .filter(Boolean) as StoredOrder[];

    if (mapped.length === 0) return readLocalOrders();
    writeLocalOrders(mapped);
    return mapped;
  } catch {
    return readLocalOrders();
  }
}
