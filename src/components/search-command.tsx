import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Layers3, Ruler, Search, Truck, Undo2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { formatPrice } from "@/lib/format-price";
import { requestedProductTypes, getProductTypeSlug } from "@/lib/product-taxonomy";
import { trackSearchQuery, trackSearchResultClick } from "@/lib/search-analytics";
import { useProducts } from "@/lib/use-products";

const helpLinks = [
  { label: "Size Guide", to: "/size-guide" as const, icon: Ruler },
  { label: "Shipping", to: "/shipping" as const, icon: Truck },
  { label: "Returns", to: "/returns" as const, icon: Undo2 },
  { label: "Track Order", to: "/track-order" as const, icon: Layers3 },
];

export function SearchCommand() {
  const navigate = useNavigate();
  const products = useProducts();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lastTrackedQuery, setLastTrackedQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      if (isModifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const productMatches = useMemo(() => {
    if (!normalizedQuery) return products.slice(0, 8);
    return products
      .map((product) => {
        const haystack = [
          product.name,
          product.brand,
          product.tagline,
          ...(product.attributes?.styles ?? []),
          ...(product.attributes?.occasions ?? []),
          ...(product.attributes?.fabrics ?? []),
        ]
          .join(" ")
          .toLowerCase();

        let score = 0;
        if (product.name.toLowerCase().includes(normalizedQuery)) score += 4;
        if (haystack.includes(normalizedQuery)) score += 2;
        if (product.badge?.toLowerCase().includes(normalizedQuery)) score += 1;
        return { product, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
      .map((entry) => entry.product);
  }, [normalizedQuery, products]);

  const collectionMatches = useMemo(() => {
    if (!normalizedQuery) return requestedProductTypes;
    return requestedProductTypes.filter((type) => type.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);

  const helpMatches = useMemo(() => {
    if (!normalizedQuery) return helpLinks;
    return helpLinks.filter((link) => link.label.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);

  const totalMatches = collectionMatches.length + productMatches.length + helpMatches.length;

  useEffect(() => {
    if (!open) return;
    if (normalizedQuery.length < 2) {
      setLastTrackedQuery("");
      return;
    }

    const handle = window.setTimeout(() => {
      if (lastTrackedQuery === normalizedQuery) return;
      trackSearchQuery(normalizedQuery, totalMatches);
      setLastTrackedQuery(normalizedQuery);
    }, 250);

    return () => window.clearTimeout(handle);
  }, [lastTrackedQuery, normalizedQuery, open, totalMatches]);

  const closeAndNavigate = async (action: () => Promise<void> | void) => {
    setOpen(false);
    setQuery("");
    setLastTrackedQuery("");
    await action();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 hover:text-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden text-xs font-medium text-muted-foreground md:inline">Search</span>
        <span className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline">
          Ctrl K
        </span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search products, categories, help..."
        />
        <CommandList>
          <CommandEmpty>No matches yet. Try a product name, category, or help topic.</CommandEmpty>

          <CommandGroup heading="Top shortcuts">
            <CommandItem
              onSelect={() => {
                trackSearchResultClick(query, "shortcut:wishlist");
                void closeAndNavigate(() => navigate({ to: "/wishlist" }));
              }}
            >
              <Heart className="h-4 w-4" />
              Wishlist
              <CommandShortcut>Saved</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                trackSearchResultClick(query, "shortcut:new-in");
                void closeAndNavigate(() => navigate({ to: "/shop", search: { sort: "newest" } }));
              }}
            >
              <Layers3 className="h-4 w-4" />
              New in
              <CommandShortcut>Fresh</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {collectionMatches.length > 0 && (
            <CommandGroup heading="Categories">
              {collectionMatches.map((type) => (
                <CommandItem
                  key={type}
                  value={`category-${type}`}
                  onSelect={() => {
                    trackSearchResultClick(query, `collection:${type}`);
                    void closeAndNavigate(() =>
                      navigate({
                        to: "/collections/$slug",
                        params: { slug: getProductTypeSlug(type) },
                      }),
                    );
                  }}
                >
                  <Layers3 className="h-4 w-4" />
                  {type}
                  <CommandShortcut>Collection</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {productMatches.length > 0 && (
            <CommandGroup heading="Products">
              {productMatches.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.brand}`}
                  onSelect={() => {
                    trackSearchResultClick(query, `product:${product.id}`);
                    void closeAndNavigate(() =>
                      navigate({
                        to: "/product/$id",
                        params: { id: product.id },
                      }),
                    );
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-10 w-10 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.brand}</div>
                  </div>
                  <CommandShortcut>{formatPrice(product.price, product.id)}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {helpMatches.length > 0 && (
            <CommandGroup heading="Help">
              {helpMatches.map((link) => {
                const Icon = link.icon;
                return (
                  <CommandItem
                    key={link.to}
                    value={link.label}
                    onSelect={() => {
                      trackSearchResultClick(query, `help:${link.label}`);
                      void closeAndNavigate(() => navigate({ to: link.to }));
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
