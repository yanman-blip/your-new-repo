import { useEffect, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Collection } from "@/lib/products";

export type ProductDraftValue = {
  name: string;
  brand: Collection;
  price: string;
  image: string;
  description: string;
  colors: string;
  sizes: string;
  gallery: string[];
};

type Mode = "create" | "edit" | null;

type Props = {
  mode: Mode;
  initial: ProductDraftValue;
  onClose: () => void;
  onSave: (draft: ProductDraftValue) => Promise<{ ok: boolean; message: string }>;
  onUpload: (files: FileList) => Promise<string[]>;
};

export function ProductEditPanel({ mode, initial, onClose, onSave, onUpload }: Props) {
  const open = mode !== null;
  const [draft, setDraft] = useState<ProductDraftValue>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(initial);
      setError(null);
    }
  }, [open, initial]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await onSave(draft);
      if (!result.ok) setError(result.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const urls = await onUpload(files);
      setDraft((prev) => ({
        ...prev,
        image: prev.image || urls[0],
        gallery: [...(prev.gallery.length > 0 ? prev.gallery : []), ...urls],
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (url: string) => {
    setDraft((prev) => {
      const nextGallery = prev.gallery.filter((g) => g !== url);
      const nextImage = prev.image === url ? nextGallery[0] ?? "" : prev.image;
      return { ...prev, gallery: nextGallery, image: nextImage };
    });
  };

  const setPrimaryImage = (url: string) => {
    setDraft((prev) => ({ ...prev, image: url }));
  };

  const title = mode === "create" ? "Add Product" : "Edit Product";
  const subtitle =
    mode === "create"
      ? "Create a new product. It will be published live as soon as the cloud confirms."
      : "Changes are saved to the cloud and shown to customers in real time.";

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          <SheetDescription>{subtitle}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-4">
            <Field label="Name *">
              <input
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="Product name"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand *">
                <select
                  value={draft.brand}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, brand: e.target.value as Collection }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <option value="Lace">Lace</option>
                  <option value="Silk">Silk</option>
                  <option value="Lounge">Lounge</option>
                  <option value="Everyday">Everyday</option>
                </select>
              </Field>

              <Field label="Price *">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price}
                  onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  placeholder="e.g. 14.59"
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={draft.description}
                onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="Short product description"
              />
            </Field>

            <Field label="Images">
              <div className="flex flex-wrap gap-2">
                {draft.gallery.map((url, idx) => (
                  <div
                    key={`${idx}-${url.slice(0, 16)}`}
                    className={`group relative h-20 w-20 overflow-hidden rounded-lg border-2 ${draft.image === url ? "border-foreground" : "border-border"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(url)}
                      title={draft.image === url ? "Primary image" : "Set as primary"}
                      className="block h-full w-full"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => removeGalleryImage(url)}
                      className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-0.5 text-white group-hover:block"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-surface text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  <span>{uploading ? "Uploading" : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    className="hidden"
                    onChange={(e) => {
                      void handleUpload(e.target.files);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Click an image to set it as the primary thumbnail. First image is used by default.
              </p>
            </Field>

            <Field
              label="Image URL"
              hint="Filled automatically when you upload. You can also paste a URL or relative /path."
            >
              <input
                value={draft.image}
                onChange={(e) => setDraft((p) => ({ ...p, image: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="/folder/image.jpg or https://…"
              />
            </Field>

            <Field label="Colors" hint="Comma-separated. Format: name:hex">
              <input
                value={draft.colors}
                onChange={(e) => setDraft((p) => ({ ...p, colors: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="Black:#1c1c1e, Red:#aa1b2a"
              />
            </Field>

            <Field label="Sizes" hint="Comma-separated.">
              <input
                value={draft.sizes}
                onChange={(e) => setDraft((p) => ({ ...p, sizes: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="S,M,L,XL"
              />
            </Field>

            {error && (
              <div className="rounded-lg border border-[#ffd1cc] bg-[#fff3f1] px-3 py-2 text-xs text-[#b42318]">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-surface px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving" : mode === "create" ? "Create" : "Save changes"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
    </label>
  );
}
