import { CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { OrderWorkflowStatus, StoredOrder } from "@/lib/orders";

type Props = {
  order: StoredOrder | null;
  busy: boolean;
  onClose: () => void;
  onApprove: (orderId: string) => void;
  statusLabel: (status: OrderWorkflowStatus) => string;
  statusBadgeClass: (status: OrderWorkflowStatus) => string;
};

export function OrderDetailDrawer({
  order,
  busy,
  onClose,
  onApprove,
  statusLabel,
  statusBadgeClass,
}: Props) {
  const open = order !== null;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {order && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4 text-left">
              <div className="flex items-center gap-2">
                <SheetTitle className="font-mono text-base">
                  Order #{order.id.slice(0, 8)}
                </SheetTitle>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(order.status)}`}
                >
                  {statusLabel(order.status)}
                </span>
              </div>
              <SheetDescription>
                Placed {new Date(order.createdAt).toLocaleString()}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-5">
                <SectionTitle>Customer</SectionTitle>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <Info label="Name">
                    {order.customer.firstName || "—"} {order.customer.lastName || ""}
                  </Info>
                  <Info label="Phone">
                    {order.customer.phoneCode} {order.customer.phone || "—"}
                  </Info>
                  <Info label="Payment method">
                    <span className="capitalize">{order.paymentMethod.replace("-", " ")}</span>
                  </Info>
                  <Info label="Fulfillment">
                    <span className="capitalize">{order.fulfillment}</span>
                  </Info>
                </div>

                <SectionTitle>Address</SectionTitle>
                <div className="rounded-xl border border-border bg-surface p-3 text-sm text-muted-foreground">
                  {[
                    order.customer.street,
                    order.customer.complex,
                    order.customer.suburb,
                    order.customer.city,
                    order.customer.province,
                    order.customer.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "No address provided"}
                </div>

                <SectionTitle>Line items</SectionTitle>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-left">Variant</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="px-3 py-2 align-top">
                            <div className="font-mono text-xs text-muted-foreground">
                              {item.productId}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top text-muted-foreground">
                            {item.color} · {item.storage}
                          </td>
                          <td className="px-3 py-2 text-right align-top">{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <SectionTitle>Totals</SectionTitle>
                <div className="grid gap-1 text-sm">
                  <Row label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
                  {order.discountAmount && order.discountAmount > 0 ? (
                    <Row
                      label={order.couponCode ? `Discount (${order.couponCode})` : "Discount"}
                      value={`-$${order.discountAmount.toFixed(2)}`}
                    />
                  ) : null}
                  <Row label="Delivery" value={`$${order.deliveryFee.toFixed(2)}`} />
                  <Row label="Tax" value={`$${order.tax.toFixed(2)}`} />
                  <Row
                    label="Total"
                    value={`$${order.total.toFixed(2)}`}
                    strong
                  />
                </div>

                <SectionTitle>Payment proof</SectionTitle>
                {order.proofFileUrl ? (
                  <div className="rounded-xl border border-border bg-surface p-3">
                    {order.proofFileUrl.match(/\.(png|jpe?g|webp|gif)$/i) ? (
                      <img
                        src={order.proofFileUrl}
                        alt={`Proof for order ${order.id}`}
                        className="max-h-72 w-full rounded-lg border border-border object-contain"
                      />
                    ) : (
                      <a
                        href={order.proofFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-600 underline underline-offset-2"
                      >
                        Open proof file ({order.proofFileName ?? "proof"})
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-surface px-3 py-6 text-center text-xs text-muted-foreground">
                    No proof uploaded yet
                  </div>
                )}
              </div>
            </div>

            {order.status !== "paid" && (
              <div className="flex items-center justify-end gap-2 border-t border-border bg-surface px-6 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-surface"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(order.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {busy ? "Approving" : "Approve as paid"}
                </button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "border-t border-border pt-2 text-base font-semibold" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={strong ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}
