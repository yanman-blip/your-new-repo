import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { Trash2, ChevronLeft, MapPin, Truck, Minus, Plus, ShieldCheck } from "lucide-react";
import { createOrderRecord, updateOrderRecord, type OrderWorkflowStatus, type PaymentMethodId } from "@/lib/orders";

const paymentMethods: { id: PaymentMethodId; name: string; instructions: string }[] = [
  { id: "ecocash", name: "EcoCash", instructions: "Send payment to EcoCash number 0772 000 000 and use your order number as reference." },
  { id: "innbucks", name: "InnBucks", instructions: "Pay via InnBucks wallet to merchant ID INB-00218 and attach your order number." },
  { id: "mukuru", name: "Mukuru", instructions: "Use Mukuru transfer to recipient WET LACE and include your order number in notes." },
  { id: "bank-transfer", name: "Bank transfer", instructions: "Transfer to CBZ 2212334455, WET LACE. Use order number as payment reference." },
  { id: "cash-on-delivery", name: "Cash on delivery", instructions: "Pay cash when your order is delivered. Keep exact amount where possible." },
];

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout - WET LACE" },
      { name: "description", content: "Review your bag and complete your WET LACE order securely." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { detailed, subtotal, remove, updateQty, count } = useCart();
  const [fulfillment, setFulfillment] = useState<"collect" | "delivery">("collect");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("ecocash");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [proofFileName, setProofFileName] = useState("");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderWorkflowStatus>("draft");
  const [orderError, setOrderError] = useState("");
  const [deliveryDetails, setDeliveryDetails] = useState({
    location: "Zimbabwe",
    firstName: "",
    lastName: "",
    phoneCode: "ZW +263",
    phone: "",
    street: "",
    complex: "",
    province: "",
    city: "",
    suburb: "",
    postalCode: "",
    idType: "national-id",
    idNumber: "",
    makeDefault: false,
    notes: "",
  });
  const [addressError, setAddressError] = useState("");
  const deliveryFee = fulfillment === "delivery" ? 5 : 0;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + deliveryFee + tax;

  const selectedPayment = paymentMethods.find((m) => m.id === paymentMethod) ?? paymentMethods[0];
  const requiresProof = paymentMethod !== "cash-on-delivery";

  const handlePlaceOrder = async () => {
    setOrderError("");

    if (fulfillment !== "delivery") {
      setAddressError("");
    }

    if (fulfillment === "delivery") {
      const requiredFields = [
        deliveryDetails.firstName,
        deliveryDetails.lastName,
        deliveryDetails.phone,
        deliveryDetails.street,
        deliveryDetails.province,
        deliveryDetails.suburb,
        deliveryDetails.city,
        deliveryDetails.postalCode,
      ];

      const hasMissingFields = requiredFields.some((field) => field.trim().length === 0);

      if (hasMissingFields) {
        setAddressError("Please fill in your delivery name, phone and full address before payment.");
        return;
      }
    }

    setAddressError("");

    const nextStatus: OrderWorkflowStatus = requiresProof ? "awaiting_proof" : "awaiting_delivery_payment";

    try {
      const created = await createOrderRecord({
        status: nextStatus,
        paymentMethod,
        fulfillment,
        subtotal,
        deliveryFee,
        tax,
        total,
        items: detailed.map((i) => ({
          productId: i.productId,
          storage: i.storage,
          color: i.color,
          qty: i.qty,
        })),
        customer: deliveryDetails,
      });

      setActiveOrderId(created.id);
      setOrderPlaced(true);
      setOrderStatus(nextStatus);
      setProofUploaded(false);
      setProofFileName("");
    } catch {
      setOrderError("Could not create order right now. Please try again.");
    }
  };

  if (count === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Your bag is empty</h1>
        <p className="mt-3 text-muted-foreground">Find something soft to slip into.</p>
        <Link to="/shop" className="mt-8 inline-block px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium">
          Shop the collection
        </Link>
      </section>
    );
  }

  const money = (value: number) => `$${value.toFixed(2)}`;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" /> Continue shopping
      </Link>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-background p-5 md:p-6">
            <h2 className="text-2xl font-semibold tracking-tight">Shipping Address</h2>
            <div className="mt-5 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">Location*</span>
                  <select
                    value={deliveryDetails.location}
                    onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                    aria-label="Location"
                  >
                    <option>Zimbabwe</option>
                    <option>Botswana</option>
                  </select>
                </label>
                <div className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">Fulfillment</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillment("collect")}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                        fulfillment === "collect" ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <MapPin className="h-4 w-4" /> Collect
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillment("delivery")}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                        fulfillment === "delivery" ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <Truck className="h-4 w-4" /> Delivery
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">First Name*</span>
                  <input
                    value={deliveryDetails.firstName}
                    onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                    placeholder="First name"
                    aria-label="First name"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">Last Name*</span>
                  <input
                    value={deliveryDetails.lastName}
                    onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                    placeholder="Last name"
                    aria-label="Last name"
                  />
                </label>
              </div>

              <div className="grid grid-cols-[100px_1fr] gap-3">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">Code</span>
                  <input
                    value={deliveryDetails.phoneCode}
                    onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, phoneCode: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                    aria-label="Phone code"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">Phone Number*</span>
                  <input
                    value={deliveryDetails.phone}
                    onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                    placeholder="Phone number"
                    aria-label="Phone number"
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Street*</span>
                <input
                  value={deliveryDetails.street}
                  onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, street: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  placeholder="Street name / street number"
                  aria-label="Street"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Complex/Building</span>
                <input
                  value={deliveryDetails.complex}
                  onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, complex: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  placeholder="Complex name, unit, floor"
                  aria-label="Complex or building"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">State/Province*</span>
                  <input
                    value={deliveryDetails.province}
                    onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, province: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                    placeholder="State/Province"
                    aria-label="State or province"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">City*</span>
                  <input
                    value={deliveryDetails.city}
                    onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                    placeholder="City"
                    aria-label="City"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">Suburb*</span>
                  <input
                    value={deliveryDetails.suburb}
                    onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, suburb: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                    placeholder="Suburb"
                    aria-label="Suburb"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted-foreground">Post/Zip Code*</span>
                  <input
                    value={deliveryDetails.postalCode}
                    onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                    placeholder="Post/Zip code"
                    aria-label="Post or zip code"
                  />
                </label>
              </div>

              <div className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Type of ID*</span>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="certificate"
                      checked={deliveryDetails.idType === "national-id"}
                      onChange={() => setDeliveryDetails((prev) => ({ ...prev, idType: "national-id" }))}
                    />
                    National ID Number
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="certificate"
                      checked={deliveryDetails.idType === "passport"}
                      onChange={() => setDeliveryDetails((prev) => ({ ...prev, idType: "passport" }))}
                    />
                    Passport Number
                  </label>
                </div>
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">{deliveryDetails.idType === "national-id" ? "National ID Number" : "Passport Number"}</span>
                <input
                  value={deliveryDetails.idNumber}
                  onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, idNumber: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  placeholder="Enter ID number"
                  aria-label="Identity document number"
                />
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={deliveryDetails.makeDefault}
                  onChange={(e) => setDeliveryDetails((prev) => ({ ...prev, makeDefault: e.target.checked }))}
                />
                Make Default
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">Order Details</h2>
              <span className="text-sm text-muted-foreground">{count} item{count === 1 ? "" : "s"}</span>
            </div>

            <ul className="mt-4 divide-y divide-border border-y border-border">
            {detailed.map((i) => (
              <li key={`${i.productId}-${i.storage}-${i.color}`} className="py-4 flex gap-3">
                <div className="w-20 h-20 rounded-lg bg-surface overflow-hidden shrink-0">
                  <img src={i.product.image} alt={i.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between gap-2">
                    <div>
                      <div className="font-medium leading-tight">{i.product.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{i.product.brand} · {i.storage} · {i.color}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-[#e14f2a]">{money(i.lineTotal)}</div>
                      <div className="text-xs text-muted-foreground">{money(i.product.price)} ea</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-border">
                      <button
                        type="button"
                        onClick={() => updateQty(i.productId, i.storage, i.color, i.qty - 1)}
                        className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label={`Decrease quantity for ${i.product.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{i.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(i.productId, i.storage, i.color, i.qty + 1)}
                        className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label={`Increase quantity for ${i.product.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(i.productId, i.storage, i.color)}
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-background p-5 md:p-6">
            <h2 className="text-2xl font-semibold tracking-tight">Payment Method</h2>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {paymentMethods.map((method) => (
                <label key={method.id} className={`flex items-center gap-3 rounded-xl border p-3 text-sm cursor-pointer transition ${paymentMethod === method.id ? "border-foreground bg-foreground/5" : "border-border bg-surface hover:border-foreground/40"}`}>
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === method.id}
                    onChange={() => {
                      setPaymentMethod(method.id);
                      setOrderPlaced(false);
                      setProofUploaded(false);
                      setProofFileName("");
                      setActiveOrderId(null);
                      setOrderStatus("draft");
                      setOrderError("");
                    }}
                  />
                  <span className="font-medium">{method.name}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface p-4">
              <div className="text-sm font-medium">Payment instructions</div>
              <p className="mt-1 text-sm text-muted-foreground">{selectedPayment.instructions}</p>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <div className="text-sm font-medium">Workflow</div>
              <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>1. Order placed</li>
                <li>2. Customer receives payment instructions</li>
                <li>3. Upload proof of payment</li>
                <li>4. Admin approves</li>
                <li>5. Order status changes to Paid</li>
              </ol>
              <div className="mt-3 text-xs">
                Status: <span className="font-semibold text-foreground">{orderStatus === "paid" ? "Paid" : orderStatus === "awaiting_admin_approval" ? "Awaiting Admin Approval" : orderStatus === "awaiting_proof" ? "Awaiting Proof of Payment" : orderStatus === "awaiting_delivery_payment" ? "Awaiting Delivery Payment" : orderStatus === "order_placed" ? "Order Placed" : "Draft"}</span>
              </div>
              {activeOrderId && (
                <div className="mt-1 text-xs text-muted-foreground">Order ID: {activeOrderId}</div>
              )}
              {orderError && (
                <div className="mt-2 rounded-lg bg-[#fff1f1] px-2 py-1 text-xs text-[#b42318]">{orderError}</div>
              )}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 h-fit rounded-2xl border border-border bg-surface p-5 md:p-6">
          <h2 className="text-3xl font-semibold tracking-tight">Order Summary</h2>

          <div className="mt-4 flex -space-x-2">
            {detailed.slice(0, 3).map((i) => (
              <img
                key={`${i.productId}-${i.storage}-${i.color}`}
                src={i.product.image}
                alt={i.product.name}
                className="h-14 w-14 rounded-lg border border-background object-cover"
              />
            ))}
          </div>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Retail Price</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">{fulfillment === "delivery" ? "Shipping Fee" : "Collection"}</dt><dd>{fulfillment === "delivery" ? money(deliveryFee) : "FREE"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Estimated tax</dt><dd>{money(tax)}</dd></div>
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-2xl text-[#e14f2a]">
              <dt>Total</dt><dd>{money(total)}</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-xl border border-[#d6eadf] bg-[#ecf8f1] px-3 py-2 text-sm text-[#1f7d57] inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Secure checkout
          </div>

          <button
            type="button"
            onClick={() => void handlePlaceOrder()}
            className="mt-5 w-full py-3.5 rounded-xl bg-black text-white text-base font-semibold hover:opacity-90 transition"
          >
            Place Order
          </button>

          {orderPlaced && (
            <div className="mt-3 rounded-xl border border-border bg-background p-3">
              <p className="text-sm font-medium">Order placed successfully</p>
              <p className="mt-1 text-xs text-muted-foreground">Follow the selected payment instructions to complete payment.</p>
            </div>
          )}

          {orderPlaced && requiresProof && (
            <div className="mt-3 rounded-xl border border-border bg-background p-3">
              <label className="text-sm font-medium" htmlFor="proof-upload">Upload proof of payment</label>
              <input
                id="proof-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setProofFileName(file.name);
                  setProofUploaded(true);
                  setOrderStatus("awaiting_admin_approval");
                  if (activeOrderId) {
                    void updateOrderRecord(activeOrderId, {
                      proofFileName: file.name,
                      status: "awaiting_admin_approval",
                    });
                  }
                }}
                className="mt-2 w-full text-xs"
              />
              {proofFileName && <p className="mt-2 text-xs text-muted-foreground">Uploaded: {proofFileName}</p>}
              {proofUploaded && <p className="mt-2 text-xs text-muted-foreground">Waiting for admin approval.</p>}
            </div>
          )}

          {addressError && (
            <p className="mt-3 text-xs text-[#b42318] text-center rounded-xl bg-[#fff1f1] px-3 py-2">{addressError}</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Payment methods: EcoCash, InnBucks, Mukuru, Bank transfer, and Cash on delivery.
          </p>
        </aside>
      </div>
    </section>
  );
}
