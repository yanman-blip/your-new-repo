import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { getProduct, products, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { Check, ChevronLeft, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product: product as NonNullable<ReturnType<typeof getProduct>> };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.product.name} — Kingpin Electronics` },
            { name: "description", content: loaderData.product.description },
            { property: "og:title", content: loaderData.product.name },
            { property: "og:description", content: loaderData.product.description },
            { property: "og:image", content: loaderData.product.image },
          ],
        }
      : {},
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">Phone not found</h1>
      <Link to="/shop" className="mt-6 inline-block underline underline-offset-4">Back to shop</Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const { add, setOpen } = useCart();
  const [storage, setStorage] = useState(product.storage[0]);
  const [color, setColor] = useState(product.colors[0].name);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add({ productId: product.id, storage, color, qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    setOpen(true);
  };

  const related = products.filter((p) => p.id !== product.id && p.brand === product.brand).slice(0, 3);

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> All phones
        </Link>
      </div>
      <section className="mx-auto max-w-7xl px-6 py-10 grid lg:grid-cols-2 gap-12">
        <div className={`rounded-3xl ${product.bg} ${product.accent} aspect-square flex items-center justify-center p-10`}>
          <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{product.brand}</div>
          <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">{product.tagline}</p>
          <p className="mt-6 text-2xl font-semibold">${product.price.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">or ${Math.round(product.price / 24)}/mo. for 24 mo.</p>

          <div className="mt-8">
            <div className="text-sm font-medium mb-3">Color — <span className="text-muted-foreground font-normal">{color}</span></div>
            <div className="flex gap-3">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  aria-label={c.name}
                  className={`w-9 h-9 rounded-full border-2 transition ${color === c.name ? "border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="text-sm font-medium mb-3">Storage</div>
            <div className="flex flex-wrap gap-2">
              {product.storage.map((s) => (
                <button
                  key={s}
                  onClick={() => setStorage(s)}
                  className={`px-4 py-2 rounded-full border text-sm transition ${storage === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={onAdd}
              className="px-7 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition inline-flex items-center gap-2"
            >
              {added ? <><Check className="w-4 h-4" /> Added</> : "Add to bag"}
            </button>
            <Link
              to="/checkout"
              onClick={() => add({ productId: product.id, storage, color, qty: 1 })}
              className="px-7 py-3 rounded-full border border-border text-sm font-medium hover:border-foreground/40 transition"
            >
              Buy now
            </Link>
          </div>

          <ul className="mt-10 grid gap-3 text-sm">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-brand" /> {h}
              </li>
            ))}
          </ul>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            {[
              { Icon: Truck, t: "Free 2-day shipping" },
              { Icon: ShieldCheck, t: "2-year warranty" },
              { Icon: RefreshCw, t: "30-day returns" },
            ].map(({ Icon, t }) => (
              <div key={t} className="flex flex-col items-start gap-1.5 rounded-xl bg-surface p-3">
                <Icon className="w-4 h-4" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">More from {product.brand}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {related.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </>
  );
}
