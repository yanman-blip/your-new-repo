import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import { fetchOrders, updateOrderRecord, type OrderWorkflowStatus, type StoredOrder } from "@/lib/orders";
import { createCustomProduct, deleteCustomProduct, fetchCustomProducts, getCustomProducts, updateCustomProduct, type Collection, type Product } from "@/lib/products";
import { hasAdminSession, signOutAdmin } from "@/lib/admin-auth";
import { uploadProductImagesToStorage } from "@/lib/product-image-storage";

export const Route = createFileRoute("/admin/orders")({
  beforeLoad: async () => {
    const check = await hasAdminSession();
    if (!check.ok) {
      throw redirect({ to: "/admin/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Admin Orders - LOFTIE" },
      { name: "description", content: "Review and approve customer payments." },
    ],
  }),
  component: AdminOrders,
});

function statusLabel(status: OrderWorkflowStatus) {
  if (status === "awaiting_proof") return "Awaiting proof";
  if (status === "awaiting_admin_approval") return "Awaiting admin approval";
  if (status === "awaiting_delivery_payment") return "Awaiting delivery payment";
  if (status === "order_placed") return "Order placed";
  if (status === "paid") return "Paid";
  return "Draft";
}

function statusBadgeClass(status: OrderWorkflowStatus) {
  if (status === "paid") return "bg-[#ecf8f1] text-[#1f7d57] border-[#c4e8d2]";
  if (status === "awaiting_admin_approval") return "bg-[#fff5e8] text-[#a85d00] border-[#ffd8a8]";
  if (status === "awaiting_proof") return "bg-[#fff3f1] text-[#b42318] border-[#ffd1cc]";
  return "bg-surface text-muted-foreground border-border";
}

function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [customProducts, setCustomProducts] = useState<Product[]>(() => getCustomProducts());
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [productMsg, setProductMsg] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedGallery, setUploadedGallery] = useState<string[]>([]);
  const [productDraft, setProductDraft] = useState({
    name: "",
    brand: "Lace" as Collection,
    price: "",
    image: "",
    description: "",
    colors: "Black:#1c1c1e",
    sizes: "S,M,L,XL",
  });

  const filtered = useMemo(() => {
    if (filter === "paid") return orders.filter((o) => o.status === "paid");
    if (filter === "pending") return orders.filter((o) => o.status !== "paid");
    return orders;
  }, [filter, orders]);

  const refresh = async () => {
    const next = await fetchOrders();
    setOrders(next);
  };
  const refreshProducts = () => setCustomProducts(getCustomProducts());

  useEffect(() => {
    void refresh();
    void fetchCustomProducts().then((remote) => {
      if (remote.length > 0) setCustomProducts(remote);
    });
  }, []);

  const approve = async (orderId: string) => {
    setBusyId(orderId);
    await updateOrderRecord(orderId, { status: "paid" });
    setBusyId(null);
    refresh();
  };

  const saveProduct = () => {
    setProductMsg("");
    const name = productDraft.name.trim();
    const image = productDraft.image.trim();
    const price = Number(productDraft.price);
    if (!name || !image || !Number.isFinite(price) || price <= 0) {
      setProductMsg("Please provide valid name, image (path or upload), and price.");
      return;
    }

    const colors = productDraft.colors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((entry) => {
        const [colorName, hex] = entry.split(":").map((x) => x.trim());
        return {
          name: colorName || "Black",
          hex: hex || "#1c1c1e",
        };
      });

    const storage = productDraft.sizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingProductId) {
      const updated = updateCustomProduct(editingProductId, {
        name,
        brand: productDraft.brand,
        price,
        image,
        gallery: uploadedGallery.length > 0 ? uploadedGallery : [image],
        description: productDraft.description.trim() || name,
        colors,
        storage,
      });
      if (!updated) {
        setProductMsg("Could not update product.");
        return;
      }
      setProductMsg(`Product updated: ${updated.name}`);
      setEditingProductId(null);
    } else {
      const created = createCustomProduct({
        name,
        brand: productDraft.brand,
        price,
        image,
        gallery: uploadedGallery.length > 0 ? uploadedGallery : [image],
        description: productDraft.description.trim() || name,
        colors,
        storage,
      });
      setProductMsg(`Product added: ${created.name}`);
    }

    setProductDraft((prev) => ({
      ...prev,
      name: "",
      price: "",
      image: "",
      description: "",
    }));
    setUploadedGallery([]);
    refreshProducts();
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const invalidFile = list.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      setProductMsg("Please upload a valid image file.");
      return;
    }
    const tooLarge = list.find((file) => file.size > 4 * 1024 * 1024);
    if (tooLarge) {
      setProductMsg("Image is too large. Please choose an image under 4MB.");
      return;
    }

    setUploadingImages(true);
    uploadProductImagesToStorage(list, "products")
      .then((imageUrls) => {
        setUploadedGallery(imageUrls);
        setProductDraft((prev) => ({ ...prev, image: imageUrls[0] }));
        setProductMsg(`${imageUrls.length} image${imageUrls.length === 1 ? "" : "s"} uploaded to storage.`);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Could not upload one or more images.";
        setProductMsg(message);
      })
      .finally(() => {
        setUploadingImages(false);
      });
  };

  const beginEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductDraft({
      name: product.name,
      brand: product.brand,
      price: product.price.toString(),
      image: product.image,
      description: product.description,
      colors: product.colors.map((c) => `${c.name}:${c.hex}`).join(", "),
      sizes: product.storage.join(","),
    });
    setUploadedGallery(product.gallery && product.gallery.length > 0 ? product.gallery : [product.image]);
    setProductMsg(`Editing: ${product.name}`);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setProductDraft((prev) => ({
      ...prev,
      name: "",
      price: "",
      image: "",
      description: "",
    }));
    setUploadedGallery([]);
    setProductMsg("");
  };

  const removeProduct = (product: Product) => {
    const ok = window.confirm(`Delete product \"${product.name}\"?`);
    if (!ok) return;
    const deleted = deleteCustomProduct(product.id);
    if (deleted) {
      if (editingProductId === product.id) cancelEdit();
      setProductMsg(`Product deleted: ${product.name}`);
      refreshProducts();
      return;
    }
    setProductMsg("Could not delete product.");
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/checkout" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to checkout
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Admin Orders</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              void signOutAdmin().then(() => navigate({ to: "/admin/login" }));
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border px-4 py-2 text-sm ${filter === "all" ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`rounded-full border px-4 py-2 text-sm ${filter === "pending" ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setFilter("paid")}
          className={`rounded-full border px-4 py-2 text-sm ${filter === "paid" ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}
        >
          Paid
        </button>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-background p-5 md:p-6">
        <h2 className="text-2xl font-semibold tracking-tight">{editingProductId ? "Edit Product" : "Add Product"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create a product from admin and publish it instantly to Home, Shop, and Product pages.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Name*</span>
            <input
              value={productDraft.name}
              onChange={(e) => setProductDraft((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
              placeholder="Product name"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Brand/Collection*</span>
            <select
              value={productDraft.brand}
              onChange={(e) => setProductDraft((prev) => ({ ...prev, brand: e.target.value as Collection }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
            >
              <option value="Lace">Lace</option>
              <option value="Silk">Silk</option>
              <option value="Lounge">Lounge</option>
              <option value="Everyday">Everyday</option>
            </select>
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Price*</span>
            <input
              value={productDraft.price}
              onChange={(e) => setProductDraft((prev) => ({ ...prev, price: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
              placeholder="e.g. 14.59"
              type="number"
              min="0"
              step="0.01"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Image Path*</span>
            <input
              value={productDraft.image}
              onChange={(e) => setProductDraft((prev) => ({ ...prev, image: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
              placeholder="/folder/image.jpg"
            />
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-3 py-2 text-xs hover:bg-surface">
                {uploadingImages ? "Uploading..." : "Upload image(s)"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploadingImages}
                  onChange={(e) => {
                    handleImageUpload(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <span className="text-xs text-muted-foreground">Upload one or many images for product gallery.</span>
            </div>
          </label>

          <label className="grid gap-1.5 text-sm md:col-span-2">
            <span className="text-muted-foreground">Description</span>
            <textarea
              value={productDraft.description}
              onChange={(e) => setProductDraft((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 min-h-24"
              placeholder="Short product description"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Colors (name:hex, comma separated)</span>
            <input
              value={productDraft.colors}
              onChange={(e) => setProductDraft((prev) => ({ ...prev, colors: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
              placeholder="Black:#1c1c1e, Red:#aa1b2a"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Sizes (comma separated)</span>
            <input
              value={productDraft.sizes}
              onChange={(e) => setProductDraft((prev) => ({ ...prev, sizes: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
              placeholder="S,M,L,XL"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveProduct}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            {editingProductId ? "Update Product" : "Add Product"}
          </button>
          {editingProductId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface"
            >
              Cancel Edit
            </button>
          )}
          {productMsg && <span className="text-sm text-muted-foreground">{productMsg}</span>}
        </div>

        {productDraft.image && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-2">Gallery preview</div>
            <div className="flex flex-wrap gap-2">
              {(uploadedGallery.length > 0 ? uploadedGallery : [productDraft.image]).map((img, idx) => (
                <img key={`${idx}-${img.slice(0, 16)}`} src={img} alt={`Product preview ${idx + 1}`} className="h-28 w-22 rounded-lg border border-border object-cover bg-surface" />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-background p-5 md:p-6">
        <h2 className="text-2xl font-semibold tracking-tight">Manage Added Products</h2>
        <p className="mt-1 text-sm text-muted-foreground">Edit or delete products created from this admin panel.</p>

        {customProducts.length === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
            No admin-added products yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {customProducts.map((product) => (
              <article key={product.id} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={product.image} alt={product.name} className="h-14 w-14 rounded-lg object-cover border border-border" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.brand} · ${product.price.toFixed(2)} · {product.id}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => beginEditProduct(product)}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(product)}
                      className="rounded-lg border border-[#ffd1cc] bg-[#fff3f1] px-3 py-1.5 text-sm text-[#b42318] hover:opacity-90"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-background p-10 text-center text-muted-foreground">
          No orders found.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {filtered.map((order) => (
            <article key={order.id} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Order ID</div>
                  <div className="font-mono text-sm">{order.id}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</div>
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${statusBadgeClass(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                  <div className="mt-2 text-2xl font-semibold text-[#e14f2a]">${order.total.toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">{order.customer.firstName} {order.customer.lastName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{order.customer.phoneCode} {order.customer.phone}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Payment Method</div>
                  <div className="font-medium capitalize">{order.paymentMethod.replace("-", " ")}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Proof</div>
                  <div className="font-medium">{order.proofFileName ?? "Not uploaded"}</div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-surface p-3 text-sm text-muted-foreground">
                {order.customer.street}{order.customer.complex ? `, ${order.customer.complex}` : ""}, {order.customer.suburb}, {order.customer.city}, {order.customer.province}, {order.customer.postalCode}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" /> {order.items.length} line item(s)
                </div>
                {order.status !== "paid" && (
                  <button
                    type="button"
                    onClick={() => void approve(order.id)}
                    disabled={busyId === order.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" /> {busyId === order.id ? "Approving..." : "Approve As Paid"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
