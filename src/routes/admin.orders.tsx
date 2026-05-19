import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import {
  fetchOrders,
  OrderConstraintError,
  updateOrderRecord,
  type OrderWorkflowStatus,
  type StoredOrder,
} from "@/lib/orders";
import { OrderDetailDrawer } from "@/components/admin/order-detail-drawer";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [{ title: "Orders - WET LACE Admin" }],
  }),
  component: AdminOrders,
});

type StatusFilter = OrderWorkflowStatus | "all";
type DateRange = "today" | "7d" | "30d" | "all";

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting_proof", label: "Awaiting proof" },
  { value: "awaiting_admin_approval", label: "Awaiting approval" },
  { value: "order_placed", label: "Order placed" },
  { value: "paid", label: "Paid" },
];

const paymentOptions = [
  { value: "all", label: "All methods" },
  { value: "ecocash", label: "EcoCash" },
  { value: "innbucks", label: "InnBucks" },
  { value: "mukuru", label: "Mukuru" },
  { value: "bank-transfer", label: "Bank transfer" },
  { value: "cash-on-delivery", label: "Cash on delivery" },
];

const dateOptions: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

function statusBadgeClass(status: OrderWorkflowStatus) {
  if (status === "paid") return "bg-[#ecf8f1] text-[#1f7d57] border-[#c4e8d2]";
  if (status === "awaiting_admin_approval") return "bg-[#fff5e8] text-[#a85d00] border-[#ffd8a8]";
  if (status === "awaiting_proof") return "bg-[#fff3f1] text-[#b42318] border-[#ffd1cc]";
  return "bg-surface text-muted-foreground border-border";
}

function statusLabel(status: OrderWorkflowStatus) {
  if (status === "awaiting_proof") return "Awaiting proof";
  if (status === "awaiting_admin_approval") return "Awaiting approval";
  if (status === "awaiting_delivery_payment") return "Awaiting delivery payment";
  if (status === "order_placed") return "Order placed";
  if (status === "paid") return "Paid";
  return "Draft";
}

function AdminOrders() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateRange>("30d");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const next = await fetchOrders();
      setOrders(next);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    let next = orders;
    if (statusFilter !== "all") next = next.filter((o) => o.status === statusFilter);
    if (paymentFilter !== "all") next = next.filter((o) => o.paymentMethod === paymentFilter);
    if (dateFilter !== "all") {
      const cutoff = Date.now() - (dateFilter === "today" ? 1 : dateFilter === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000;
      next = next.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter((o) => {
        const full = `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase();
        return (
          full.includes(q) ||
          o.customer.phone.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
        );
      });
    }
    return next;
  }, [orders, statusFilter, paymentFilter, dateFilter, search]);

  const stats = useMemo(() => {
    return {
      pendingProof: orders.filter((o) => o.status === "awaiting_proof").length,
      awaitingApproval: orders.filter((o) => o.status === "awaiting_admin_approval").length,
      paid: orders.filter((o) => o.status === "paid").length,
    };
  }, [orders]);

  const selectedOrder = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;

  const approve = async (orderId: string) => {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await updateOrderRecord(orderId, { status: "paid" });
      if (!updated) {
        setActionError("Order not found.");
        return;
      }
      await refresh();
    } catch (err) {
      if (err instanceof OrderConstraintError) {
        setActionError(err.message);
      } else {
        const msg = err instanceof Error ? err.message : "Could not approve order.";
        setActionError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {orders.length} order{orders.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-surface disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Awaiting proof" value={stats.pendingProof} tone="red" />
        <StatCard label="Awaiting approval" value={stats.awaitingApproval} tone="amber" />
        <StatCard label="Paid" value={stats.paid} tone="green" />
      </div>

      {actionError && (
        <div
          role="alert"
          className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-[#ffd1cc] bg-[#fff3f1] px-3 py-2 text-sm text-[#b42318]"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs underline underline-offset-2 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border border-border bg-background p-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </label>
            <div className="mt-2 grid gap-1">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-left text-sm transition ${
                    statusFilter === opt.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Payment
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {paymentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Date range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateRange)}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {dateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Customer
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, phone, or id"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>
        </aside>

        <div>
          {loading && orders.length === 0 ? (
            <div className="rounded-2xl border border-border bg-background p-10 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              <div className="mt-2">Loading orders…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-background p-10 text-center text-sm text-muted-foreground">
              No orders match these filters.
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className="rounded-2xl border border-border bg-background p-4 text-left transition hover:border-foreground/30 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <div className="mt-1 font-medium">
                        {order.customer.firstName} {order.customer.lastName || ""}
                        {!order.customer.firstName && !order.customer.lastName && "Guest"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString()} ·{" "}
                        {order.paymentMethod.replace("-", " ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-[#e14f2a]">
                        ${order.total.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  {order.status === "awaiting_admin_approval" && (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs text-[#a85d00]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#a85d00]" />
                      Proof uploaded — needs approval
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <OrderDetailDrawer
        order={selectedOrder}
        busy={busy}
        onClose={() => setSelectedId(null)}
        onApprove={(id) => void approve(id)}
        statusLabel={statusLabel}
        statusBadgeClass={statusBadgeClass}
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "red" | "amber" | "green";
}) {
  const toneClass =
    tone === "red"
      ? "border-[#ffd1cc] bg-[#fff3f1] text-[#b42318]"
      : tone === "amber"
        ? "border-[#ffd8a8] bg-[#fff5e8] text-[#a85d00]"
        : "border-[#c4e8d2] bg-[#ecf8f1] text-[#1f7d57]";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}

