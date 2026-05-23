import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/lib/products";
import { clearSearchAnalytics, useSearchAnalytics } from "@/lib/search-analytics";
import { useHomeMerchandisingSettings, type HomeMerchandisingSettings } from "@/lib/merchandising-settings";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Settings - WET LACE Admin" }],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const products = getProducts();
  const { settings: merchSettings, update: updateMerchSettings, reset: resetMerchSettings } =
    useHomeMerchandisingSettings();
  const topQueries = useSearchAnalytics().slice(0, 8);
  const [merchDraft, setMerchDraft] = useState<HomeMerchandisingSettings>(merchSettings);
  const [merchMessage, setMerchMessage] = useState("");

  useEffect(() => {
    setMerchDraft(merchSettings);
  }, [merchSettings]);

  const topDestinations = useMemo(() => {
    const accumulator = new Map<string, number>();
    for (const entry of topQueries) {
      for (const [destination, count] of Object.entries(entry.destinations)) {
        accumulator.set(destination, (accumulator.get(destination) ?? 0) + count);
      }
    }
    return Array.from(accumulator.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
  }, [topQueries]);

  return (
    <section>
      <header className="mb-5">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Store configuration, account, and integrations.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Home Merchandising"
          description="Control hero and homepage rails without editing route code."
        >
          <div className="grid gap-3">
            <label className="grid gap-1 text-xs">
              <span className="text-muted-foreground">Featured product (hero)</span>
              <select
                value={merchDraft.featuredProductId}
                onChange={(event) =>
                  setMerchDraft((prev) => ({ ...prev, featuredProductId: event.target.value }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">Hero rotation (ms)</span>
                <input
                  type="number"
                  min={2000}
                  max={15000}
                  value={merchDraft.heroRotationMs}
                  onChange={(event) =>
                    setMerchDraft((prev) => ({
                      ...prev,
                      heroRotationMs: Number(event.target.value) || prev.heroRotationMs,
                    }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">Sale rail title</span>
                <input
                  value={merchDraft.saleRailTitle}
                  onChange={(event) =>
                    setMerchDraft((prev) => ({ ...prev, saleRailTitle: event.target.value }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">Flash label</span>
                <input
                  value={merchDraft.flashSaleLabel}
                  onChange={(event) =>
                    setMerchDraft((prev) => ({ ...prev, flashSaleLabel: event.target.value }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">Flash code</span>
                <input
                  value={merchDraft.flashSaleCode}
                  onChange={(event) =>
                    setMerchDraft((prev) => ({ ...prev, flashSaleCode: event.target.value }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">Sale start index</span>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={merchDraft.saleStartIndex}
                  onChange={(event) =>
                    setMerchDraft((prev) => ({
                      ...prev,
                      saleStartIndex: Number(event.target.value) || 0,
                    }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">Sale count</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={merchDraft.saleCount}
                  onChange={(event) =>
                    setMerchDraft((prev) => ({
                      ...prev,
                      saleCount: Number(event.target.value) || 1,
                    }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">New drops count</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={merchDraft.newDropsCount}
                  onChange={(event) =>
                    setMerchDraft((prev) => ({
                      ...prev,
                      newDropsCount: Number(event.target.value) || 1,
                    }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">Trending count</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={merchDraft.trendingCount}
                  onChange={(event) =>
                    setMerchDraft((prev) => ({
                      ...prev,
                      trendingCount: Number(event.target.value) || 1,
                    }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>

            <label className="grid gap-1 text-xs">
              <span className="text-muted-foreground">Category shortcuts (comma separated)</span>
              <input
                value={merchDraft.categoryShortcuts.join(", ")}
                onChange={(event) =>
                  setMerchDraft((prev) => ({
                    ...prev,
                    categoryShortcuts: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            {merchMessage && <p className="text-xs text-[#1f7d57]">{merchMessage}</p>}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  updateMerchSettings(merchDraft);
                  setMerchMessage("Saved merchandising settings.");
                }}
                className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => {
                  resetMerchSettings();
                  setMerchMessage("Reset to defaults.");
                }}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold"
              >
                Reset defaults
              </button>
            </div>
          </div>
        </Card>

        <Card title="Search Analytics" description="See what shoppers are actively trying to find in the command search.">
          {topQueries.length === 0 ? (
            <Note text="No tracked searches yet. Open the storefront search and type a few queries to start collecting demand signals." />
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => clearSearchAnalytics()}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
              >
                Clear analytics
              </button>

              <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[1.6fr_repeat(3,0.6fr)] gap-2 border-b border-border bg-surface px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Query</span>
                <span className="text-right">Searches</span>
                <span className="text-right">Zero</span>
                <span className="text-right">Clicks</span>
              </div>
              {topQueries.map((entry) => (
                <div key={entry.query} className="grid grid-cols-[1.6fr_repeat(3,0.6fr)] gap-2 border-b border-border/70 px-3 py-2 text-sm last:border-b-0">
                  <span className="truncate font-medium">{entry.query}</span>
                  <span className="text-right text-muted-foreground">{entry.searches}</span>
                  <span className="text-right text-muted-foreground">{entry.zeroResults}</span>
                  <span className="text-right text-muted-foreground">{entry.clicks}</span>
                </div>
              ))}
              </div>

              {topDestinations.length > 0 && (
                <div className="rounded-xl border border-border bg-surface/40 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Top clicked destinations
                  </div>
                  <div className="mt-2 space-y-1.5 text-xs">
                    {topDestinations.map(([destination, count]) => (
                      <div key={destination} className="flex items-center justify-between gap-3">
                        <span className="truncate text-muted-foreground">{destination}</span>
                        <span className="font-semibold text-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title="Auth" description="Use your own Supabase Auth admin URL for users, roles, and providers.">
          <Note text="Set Site URL and redirect URLs for production, preview, and localhost." />
        </Card>

        <Card title="Database" description="Use your own SQL/admin tooling for schema, policies, and data.">
          <Note text="Run all SQL files in supabase/migrations against your self-hosted database." />
        </Card>

        <Card title="Storage" description="Configure product and payment-proof buckets on your own Supabase instance.">
          <Note text="Confirm storage policies and CORS allow your web app domains." />
        </Card>

        <Card title="Deployment" description="Manage logs and environment variables in your own hosting provider.">
          <Note text="Required vars: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY), SUPABASE_SERVICE_ROLE_KEY." />
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        More in-app settings (store hours, default delivery fees, notification preferences) coming soon.
      </p>
    </section>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return (
    <p className="text-sm text-foreground">{text}</p>
  );
}
