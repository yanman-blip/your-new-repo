import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, Pencil } from "lucide-react";
import {
  createCustomProduct,
  deleteCustomProduct,
  fetchCustomProducts,
  flushPendingWrites,
  getProducts,
  hasPendingSync,
  subscribeProducts,
  subscribeProductsRealtime,
  updateCustomProduct,
  type Collection,
  type Product,
} from "@/lib/products";
import { uploadProductImagesToStorage } from "@/lib/product-image-storage";
import { ProductEditPanel, type ProductDraftValue } from "@/components/admin/product-edit-panel";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [{ title: "Products - WET LACE Admin" }],
  }),
  component: AdminProducts,
});

const PAGE_SIZE = 25;

type SortKey = "updated" | "name" | "price-asc" | "price-desc";
type StatusFilter = "all" | "synced" | "pending";

const emptyDraft: ProductDraftValue = {
  name: "",
  brand: "Lace",
  price: "",
  image: "",
  description: "",
  colors: "Black:#1c1c1e",
  sizes: "S,M,L,XL",
  gallery: [],
};

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState<"All" | Collection>("All");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    const refresh = () => setProducts(getProducts());
    const unsubStore = subscribeProducts(refresh);
    const unsubRealtime = subscribeProductsRealtime();
    void fetchCustomProducts().then(refresh);
    void flushPendingWrites();
    return () => {
      unsubStore();
      unsubRealtime();
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let next = products;
    if (query) {
      next = next.filter(
        (p) => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query),
      );
    }
    if (brand !== "All") {
      next = next.filter((p) => p.brand === brand);
    }
    if (status === "synced") {
      next = next.filter((p) => !hasPendingSync(p.id));
    } else if (status === "pending") {
      next = next.filter((p) => hasPendingSync(p.id));
    }
    next = [...next];
    if (sort === "name") next.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "price-asc") next.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") next.sort((a, b) => b.price - a.price);
    // "updated" sort keeps the existing order from getProducts() which is
    // already updated-desc thanks to fetchCustomProducts ordering.
    return next;
  }, [products, search, brand, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = paged.every((p) => next.has(p.id));
      if (allSelected) {
        paged.forEach((p) => next.delete(p.id));
      } else {
        paged.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ok = window.confirm(`Delete ${selectedIds.size} product(s)? This cannot be undone.`);
    if (!ok) return;
    setBulkBusy(true);
    const failures: string[] = [];
    for (const id of Array.from(selectedIds)) {
      try {
        await deleteCustomProduct(id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        failures.push(`${id}: ${msg}`);
      }
    }
    setBulkBusy(false);
    clearSelection();
    setMessage(
      failures.length === 0
        ? `Deleted ${selectedIds.size} product(s).`
        : `Deleted ${selectedIds.size - failures.length} product(s). ${failures.length} failed.`,
    );
  };

  const saveProduct = async (draft: ProductDraftValue): Promise<{ ok: boolean; message: string }> => {
    const name = draft.name.trim();
    const image = draft.image.trim();
    const priceNum = Number(draft.price);
    if (!name || !image || !Number.isFinite(priceNum) || priceNum <= 0) {
      return { ok: false, message: "Please provide a valid name, image, and price greater than 0." };
    }

    const colors = draft.colors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((entry) => {
        const [colorName, hex] = entry.split(":").map((x) => x.trim());
        return { name: colorName || "Black", hex: hex || "#1c1c1e" };
      });

    const storage = draft.sizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const gallery = draft.gallery.length > 0 ? draft.gallery : [image];
    const payload = {
      name,
      brand: draft.brand,
      price: priceNum,
      image,
      gallery,
      description: draft.description.trim() || name,
      colors,
      storage,
    };

    try {
      if (editing && editing !== "new") {
        const updated = await updateCustomProduct(editing.id, payload);
        return { ok: true, message: `Updated and synced: ${updated.name}` };
      }
      const created = await createCustomProduct(payload);
      return { ok: true, message: `Created and synced: ${created.name}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error.";
      return { ok: false, message: `Cloud sync failed. Saved locally only. ${msg}` };
    }
  };

  const uploadImages = async (files: FileList): Promise<string[]> => {
    const list = Array.from(files);
    const tooLarge = list.find((file) => file.size > 4 * 1024 * 1024);
    if (tooLarge) throw new Error("Image is too large. Please choose an image under 4MB.");
    const invalid = list.find((file) => !file.type.startsWith("image/"));
    if (invalid) throw new Error("Please upload a valid image file.");
    return uploadProductImagesToStorage(list, "products");
  };

  const allOnPageSelected = paged.length > 0 && paged.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  return (
    <section>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
            {filtered.length !== products.length ? ` (filtered from ${products.length})` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing("new");
            setMessage(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </header>

      <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-background p-4 md:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search products by name or id"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm"
          />
        </label>
        <FilterSelect
          label="Brand"
          value={brand}
          onChange={(v) => {
            setBrand(v as "All" | Collection);
            setPage(1);
          }}
          options={["All", "Lace", "Silk", "Lounge", "Everyday"]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => {
            setStatus(v as StatusFilter);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "synced", label: "Synced" },
            { value: "pending", label: "Pending sync" },
          ]}
        />
        <FilterSelect
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={[
            { value: "updated", label: "Recently updated" },
            { value: "name", label: "Name (A–Z)" },
            { value: "price-asc", label: "Price (low → high)" },
            { value: "price-desc", label: "Price (high → low)" },
          ]}
        />
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          {message}
        </div>
      )}

      {someSelected && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-[#fff8ef] px-3 py-2 text-sm">
          <span>
            <strong>{selectedIds.size}</strong> selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-xs hover:bg-surface"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => void bulkDelete()}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#ffd1cc] bg-[#fff3f1] px-3 py-1.5 text-xs font-medium text-[#b42318] hover:opacity-90 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {bulkBusy ? "Deleting…" : "Delete selected"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all on page"
                  checked={allOnPageSelected}
                  onChange={selectAllOnPage}
                />
              </th>
              <th className="px-3 py-3 text-left">Product</th>
              <th className="hidden px-3 py-3 text-left md:table-cell">Brand</th>
              <th className="px-3 py-3 text-right">Price</th>
              <th className="hidden px-3 py-3 text-left md:table-cell">Status</th>
              <th className="w-32 px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No products match these filters.
                </td>
              </tr>
            ) : (
              paged.map((product) => {
                const pending = hasPendingSync(product.id);
                const selected = selectedIds.has(product.id);
                return (
                  <tr
                    key={product.id}
                    className={`border-b border-border last:border-0 ${selected ? "bg-[#fff8ef]" : ""}`}
                  >
                    <td className="px-3 py-3 align-middle">
                      <input
                        type="checkbox"
                        aria-label={`Select ${product.name}`}
                        checked={selected}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(product);
                          setMessage(null);
                        }}
                        className="flex items-center gap-3 text-left"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 flex-shrink-0 rounded-md border border-border object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <div className="line-clamp-2 font-medium text-foreground">
                            {product.name}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {product.id}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="hidden px-3 py-3 align-middle text-muted-foreground md:table-cell">
                      {product.brand}
                    </td>
                    <td className="px-3 py-3 text-right align-middle font-medium">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="hidden px-3 py-3 align-middle md:table-cell">
                      {pending ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#ffd8a8] bg-[#fff5e8] px-2 py-0.5 text-[10px] font-medium text-[#a85d00]">
                          <span className="h-1 w-1 rounded-full bg-[#a85d00]" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#c4e8d2] bg-[#ecf8f1] px-2 py-0.5 text-[10px] font-medium text-[#1f7d57]">
                          <span className="h-1 w-1 rounded-full bg-[#1f7d57]" />
                          Live
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right align-middle">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => {
                            setEditing(product);
                            setMessage(null);
                          }}
                          className="inline-flex items-center justify-center rounded-md border border-border bg-background p-1.5 hover:bg-surface"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${product.name}`}
                          onClick={async () => {
                            const ok = window.confirm(`Delete "${product.name}"?`);
                            if (!ok) return;
                            try {
                              await deleteCustomProduct(product.id);
                              setMessage(`Deleted: ${product.name}`);
                            } catch (err) {
                              const msg = err instanceof Error ? err.message : "Unknown error.";
                              setMessage(`Delete failed: ${msg}`);
                            }
                          }}
                          className="inline-flex items-center justify-center rounded-md border border-[#ffd1cc] bg-[#fff3f1] p-1.5 text-[#b42318] hover:opacity-90"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-surface disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-surface disabled:opacity-50"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductEditPanel
        mode={editing === "new" ? "create" : editing ? "edit" : null}
        initial={editing && editing !== "new" ? productToDraft(editing) : emptyDraft}
        onClose={() => setEditing(null)}
        onSave={async (draft) => {
          const result = await saveProduct(draft);
          if (result.ok) {
            setEditing(null);
            setMessage(result.message);
          }
          return result;
        }}
        onUpload={uploadImages}
      />
    </section>
  );
}

function productToDraft(product: Product): ProductDraftValue {
  return {
    name: product.name,
    brand: product.brand,
    price: product.price.toString(),
    image: product.image,
    description: product.description,
    colors: product.colors.map((c) => `${c.name}:${c.hex}`).join(", "),
    sizes: product.storage.join(","),
    gallery: product.gallery && product.gallery.length > 0 ? product.gallery : [product.image],
  };
}

type FilterOption = string | { value: string; label: string };

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}) {
  return (
    <label className="grid gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        {options.map((opt) => {
          const v = typeof opt === "string" ? opt : opt.value;
          const l = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    </label>
  );
}
