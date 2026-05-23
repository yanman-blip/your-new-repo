import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import {
  inferProductTypes,
  getProductTypeFromSlug,
  getProductTypeSlug,
  productTypeLandingContent,
  requestedProductTypes,
} from "@/lib/product-taxonomy";
import { useProducts } from "@/lib/use-products";

export const Route = createFileRoute("/collections/$slug")({
  loader: ({ params }) => {
    const type = getProductTypeFromSlug(params.slug);
    if (!type) throw notFound();
    return { type, content: productTypeLandingContent[type] };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData.content.title} - WET LACE` },
      { name: "description", content: loaderData.content.description },
    ],
  }),
  component: CollectionLandingPage,
});

function CollectionLandingPage() {
  const { type, content } = Route.useLoaderData();
  const products = useProducts();
  const matchingProducts = products.filter((product) => inferProductTypes(product).includes(type));
  const heroProduct = matchingProducts[0];
  const crossLinks = requestedProductTypes.filter((entry) => entry !== type).slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <Link
        to="/shop"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="mt-6 overflow-hidden rounded-[2rem] bg-[#fff1f4]">
        <div className="grid gap-6 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#111] px-3 py-1 text-xs font-semibold text-white">
              {content.badge}
            </div>
            <div className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#c9123a]">
              {content.eyebrow}
            </div>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
              {content.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
              {content.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/shop"
                search={{ types: type }}
                className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
              >
                Shop {type}
              </Link>
              <Link
                to="/shop"
                search={{ types: type, sort: "newest" }}
                className="rounded-full border border-black px-5 py-2.5 text-sm font-semibold"
              >
                New arrivals
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-white/70 p-4 backdrop-blur">
            {heroProduct ? (
              <>
                <img
                  src={heroProduct.image}
                  alt={heroProduct.name}
                  className="aspect-3/4 w-full rounded-[1.25rem] object-cover"
                />
                <div className="mt-4 text-sm font-semibold">{heroProduct.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{heroProduct.tagline}</div>
              </>
            ) : (
              <div className="flex h-full min-h-[260px] items-center justify-center rounded-[1.25rem] border border-dashed border-border bg-white text-sm text-muted-foreground">
                New pieces for this edit are coming in.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {crossLinks.map((entry) => (
          <Link
            key={entry}
            to="/collections/$slug"
            params={{ slug: getProductTypeSlug(entry) }}
            className="rounded-full border border-border bg-white px-4 py-2 text-xs font-medium hover:border-foreground/40"
          >
            Explore {entry}
          </Link>
        ))}
      </div>

      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Shop the edit</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {matchingProducts.length} products mapped to this category right now.
          </p>
        </div>
        <Link
          to="/shop"
          search={{ types: type }}
          className="hidden items-center gap-2 text-sm hover:text-foreground md:inline-flex"
        >
          View all in shop <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {matchingProducts.map((product) => (
          <ProductCard key={product.id} p={product} clean />
        ))}
      </div>
    </section>
  );
}
