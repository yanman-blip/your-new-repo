import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { fetchOrders, type StoredOrder } from "@/lib/orders";
import {
  fetchCustomProducts,
  getPendingProductIds,
  getProducts,
  subscribeProducts,
  type Product,
} from "@/lib/products";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard - WET LACE Admin" }],
  }),
  component: AdminDashboard,
});

type Activity =
  | { kind: "order"; at: number; label: string; sublabel: string; status: string; href?: string }
  | { kind: "product"; at: number; label: string; sublabel: string };

function AdminDashboard() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    void fetchOrders().then(setOrders);
    void fetchCustomProducts();
    const recompute = () => {
      setProducts(getProducts());
      setPendingCount(getPendingProductIds().length);
    };
    recompute();
    const unsubscribe = subscribeProducts(recompute);
    return unsubscribe;
  }, []);

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const todayStart = start.getTime();
    const paidToday = orders.filter(
      (o) => o.status === "paid" && new Date(o.updatedAt).getTime() >= todayStart,
    );
    return {
      revenue: paidToday.reduce((sum, o) => sum + o.total, 0),
      paidCount: paidToday.length,
      awaitingProof: orders.filter((o) => o.status === "awaiting_proof").length,
      awaitingApproval: orders.filter((o) => o.status === "awaiting_admin_approval").length,
    };
  }, [orders]);

  const recentActivity = useMemo<Activity[]>(() => {
    const orderActivity: Activity[] = orders.slice(0, 12).map((o) => ({
      kind: "order",
      at: new Date(o.updatedAt).getTime(),
      label: `Order #${o.id.slice(0, 8)} — $${o.total.toFixed(2)}`,
      sublabel:
        o.customer.firstName || o.customer.lastName
          ? `${o.customer.firstName} ${o.customer.lastName}`.trim()
          : "Guest checkout",
      status: o.status,
    }));
    return orderActivity.sort((a, b) => b.at - a.at).slice(0, 10);
  }, [orders]);

  return (
    <section>
      <header className="mb-5">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Awaiting approval"
          value={today.awaitingApproval}
          icon={Clock3}
          tone="amber"
          href="/admin/orders"
          hint={today.awaitingApproval > 0 ? "Review now" : "Nothing pending"}
        />
        <StatCard
          label="Awaiting proof"
          value={today.awaitingProof}
          icon={ShoppingBag}
          tone="red"
          href="/admin/orders"
          hint={today.awaitingProof > 0 ? "Customer payment due" : "All caught up"}
        />
        <StatCard
          label="Today's revenue"
          value={`$${today.revenue.toFixed(2)}`}
          icon={TrendingUp}
          tone="green"
          hint={`${today.paidCount} paid order${today.paidCount === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Products live"
          value={products.length}
          icon={Package}
          tone="neutral"
          href="/admin/products"
          hint={pendingCount > 0 ? `${pendingCount} pending sync` : "All in sync"}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <Link to="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No orders yet. Once customers start checking out, their orders will appear here.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentActivity.map((a, idx) => (
                <li key={idx} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{a.label}</div>
                      <div className="truncate text-xs text-muted-foreground">{a.sublabel}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {timeAgo(a.at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <h2 className="text-sm font-semibold">Quick actions</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <Link
              to="/admin/products"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-surface"
            >
              <span>Add a product</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-surface"
            >
              <span>Review pending orders</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              to="/"
              target="_blank"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-surface"
            >
              <span>Open storefront</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  href,
  hint,
}: {
  label: string;
  value: number | string;
  icon: typeof Clock3;
  tone: "red" | "amber" | "green" | "neutral";
  href?: "/admin/dashboard" | "/admin/products" | "/admin/orders" | "/admin/settings";
  hint?: string;
}) {
  const toneClass =
    tone === "red"
      ? "border-[#ffd1cc] bg-[#fff3f1] text-[#b42318]"
      : tone === "amber"
        ? "border-[#ffd8a8] bg-[#fff5e8] text-[#a85d00]"
        : tone === "green"
          ? "border-[#c4e8d2] bg-[#ecf8f1] text-[#1f7d57]"
          : "border-border bg-background text-foreground";
  const inner = (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {hint && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs opacity-80">
          {hint}
          {href && <ArrowRight className="h-3 w-3" />}
        </div>
      )}
    </div>
  );
  if (href) {
    return (
      <Link to={href} className="block transition hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minute = 60 * 1000;
  if (diff < minute) return "just now";
  if (diff < 60 * minute) return `${Math.floor(diff / minute)}m ago`;
  if (diff < 24 * 60 * minute) return `${Math.floor(diff / (60 * minute))}h ago`;
  return `${Math.floor(diff / (24 * 60 * minute))}d ago`;
}
