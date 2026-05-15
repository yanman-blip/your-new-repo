import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/lib/cart";

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

function getOptionalSupabase(): any | null {
  try {
    return supabase as any;
  } catch {
    return null;
  }
}

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
    await client.from("orders").insert({
      id: order.id,
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
  } catch {
    // Graceful fallback: order is still persisted locally.
  }

  return order;
}

export async function updateOrderRecord(orderId: string, patch: Partial<StoredOrder>): Promise<StoredOrder | null> {
  const orders = readLocalOrders();
  const existing = orders.find((o) => o.id === orderId);
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
      await client
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
    } catch {
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
      .map((row: any) => row?.payload as StoredOrder | null)
      .filter(Boolean) as StoredOrder[];

    if (mapped.length === 0) return readLocalOrders();
    return mapped;
  } catch {
    return readLocalOrders();
  }
}
