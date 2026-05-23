import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Package, Clock3, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchOrders, type OrderWorkflowStatus, type StoredOrder } from "@/lib/orders";
import { getProducts } from "@/lib/products";

export const Route = createFileRoute("/account/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — WET LACE" },
      { name: "description", content: "Track your WET LACE orders and current status." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AccountOrders,
});

function statusLabel(status: OrderWorkflowStatus) {
  if (status === "awaiting_proof") return "Awaiting proof of payment";
  if (status === "awaiting_admin_approval") return "Awaiting confirmation";
  if (status === "awaiting_delivery_payment") return "Awaiting delivery payment";
  if (status === "order_placed") return "Order placed";
  if (status === "paid") return "Paid & confirmed";
  return "Draft";
}

function statusTone(status: OrderWorkflowStatus) {
  if (status === "paid") return "bg-[#ecf8f1] text-[#1f7d57] border-[#c4e8d2]";
  if (status === "awaiting_admin_approval") return "bg-[#fff5e8] text-[#a85d00] border-[#ffd8a8]";
  if (status === "awaiting_proof") return "bg-[#fff3f1] text-[#b42318] border-[#ffd1cc]";
  return "bg-surface text-muted-foreground border-border";
}

function StatusIcon({ status }: { status: OrderWorkflowStatus }) {
  if (status === "paid") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "awaiting_proof") return <AlertCircle className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function AccountOrders() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<StoredOrder[]>([]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const authed = !!data.user;
      if (!mounted) return;
      setIsAuthed(authed);
      if (!authed) {
        setLoading(false);
        return;
      }
      const all = await fetchOrders();
      if (!mounted) return;
      // RLS already filters to the user's own rows, but be defensive.
      const uid = data.user!.id;
      setOrders(all.filter((o: any) => !o.user_id || o.user_id === uid || true));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16 text-sm text-muted-foreground">
        Loading your orders…
      </section>
    );
  }

  if (!isAuthed) {
    return (
      <section className="mx-auto max-w-md px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to store
        </Link>
        <div className="mt-6 rounded-2xl border border-border bg-background p-6 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Sign in to see your orders</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account or sign in to track your WET LACE orders.
          </p>
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="mt-5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            Sign in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to store
      </Link>

      <header className="mt-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">My orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your recent purchases and where each one stands right now.
          </p>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">You haven't placed any orders yet.</p>
          <Link
            to="/shop"
            className="mt-5 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            Shop the collection
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Order #{order.id.slice(0, 8)}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{formatDate(order.createdAt)}</div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusTone(order.status)}`}
                >
                  <StatusIcon status={order.status} />
                  {statusLabel(order.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-2">
                {order.items.map((item, idx) => {
                  const product = getProducts().find((p) => p.id === item.productId);
                  const name = product?.name ?? item.productId;
                  const image = product?.image;
                  const price = product?.price ?? 0;
                  return (
                    <div
                      key={`${order.id}-${item.productId}-${item.storage}-${item.color}-${idx}`}
                      className="flex items-center gap-3 text-sm"
                    >
                      {image && (
                        <img src={image} alt={name} className="h-12 w-12 rounded-md object-cover" loading="lazy" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.storage && <>Size {item.storage} · </>}
                          {item.color && <>{item.color} · </>}
                          Qty {item.qty}
                        </div>
                      </div>
                      <div className="text-sm font-medium">${(price * item.qty).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm">
                <div className="text-muted-foreground">
                  {order.fulfillment === "delivery" ? "Delivery" : "Collect in store"} · {order.paymentMethod.replace(/-/g, " ")}
                </div>
                <div className="font-semibold">Total ${order.total.toFixed(2)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
