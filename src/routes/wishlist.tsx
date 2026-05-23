import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Heart, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/lib/cart";
import { getProducts } from "@/lib/products";
import { useWishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist - WET LACE" },
      { name: "description", content: "Your saved WET LACE favourites, ready when you are." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids, toggle } = useWishlist();
  const { add, setOpen } = useCart();
  const products = getProducts();
  const wishlistProducts = products.filter((product) => ids.includes(product.id));

  if (wishlistProducts.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16">
        <Link
          to="/shop"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Continue shopping
        </Link>

        <div className="mt-8 rounded-[2rem] border border-dashed border-border bg-[#fff8fa] px-6 py-16 text-center">
          <Heart className="mx-auto h-10 w-10 text-[#fe2c55]" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Your wishlist is empty</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Save the styles you want to come back to, compare, or grab later when stock drops.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/shop"
              className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
            >
              Explore the shop
            </Link>
            <Link
              to="/shop"
              search={{ sort: "newest" }}
              className="rounded-full border border-black px-5 py-2.5 text-sm font-semibold"
            >
              Browse new in
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Link
        to="/shop"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Continue shopping
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0f2] px-3 py-1 text-xs font-semibold text-[#c9123a]">
            <Heart className="h-3.5 w-3.5 fill-current" />
            SAVED PICKS
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Your wishlist</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {wishlistProducts.length} saved {wishlistProducts.length === 1 ? "style" : "styles"}{" "}
            ready for checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const first = wishlistProducts[0];
            if (!first) return;
            add({
              productId: first.id,
              storage: first.storage[0] ?? "One Size",
              color: first.colors[0]?.name ?? "Default",
              qty: 1,
            });
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
        >
          <ShoppingBag className="h-4 w-4" /> Quick add first item
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {wishlistProducts.map((product) => (
          <div key={product.id} className="space-y-3">
            <ProductCard p={product} clean />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggle(product.id)}
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-foreground/40"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => {
                  add({
                    productId: product.id,
                    storage: product.storage[0] ?? "One Size",
                    color: product.colors[0]?.name ?? "Default",
                    qty: 1,
                  });
                  setOpen(true);
                }}
                className="flex-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Add to bag
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
