import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Package, Settings, ShoppingBag } from "lucide-react";
import { hasAdminSession, signOutAdmin } from "@/lib/admin-auth";
import {
  flushPendingWrites,
  getPendingProductIds,
  subscribeProducts,
  subscribeProductsRealtime,
} from "@/lib/products";
import { PendingSyncToast } from "@/components/admin/pending-sync-toast";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    // The login page is nested under /admin but must be reachable without a
    // session — otherwise the auth check below would redirect into itself.
    if (location.pathname.startsWith("/admin/login")) return;

    const check = await hasAdminSession();
    if (!check.ok) {
      throw redirect({ to: "/admin/login" });
    }
    if (location.pathname === "/admin") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  component: AdminLayout,
});

type TabDef = {
  to: "/admin/dashboard" | "/admin/products" | "/admin/orders" | "/admin/settings";
  label: string;
  Icon: typeof LayoutDashboard;
};

const tabs: TabDef[] = [
  { to: "/admin/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/orders", label: "Orders", Icon: ShoppingBag },
  { to: "/admin/settings", label: "Settings", Icon: Settings },
];

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [pendingCount, setPendingCount] = useState(0);
  const isLoginPage = path.startsWith("/admin/login");

  useEffect(() => {
    if (isLoginPage) return;
    const recompute = () => setPendingCount(getPendingProductIds().length);
    recompute();
    const unsubStore = subscribeProducts(recompute);
    const unsubRealtime = subscribeProductsRealtime();
    void flushPendingWrites().then(recompute);
    return () => {
      unsubStore();
      unsubRealtime();
    };
  }, [isLoginPage]);

  // Login page renders standalone — no admin chrome around it.
  if (isLoginPage) return <Outlet />;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-lg font-semibold tracking-tight">
              WET LACE <span className="text-muted-foreground">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <SyncBadge pendingCount={pendingCount} />
            <button
              type="button"
              onClick={() => {
                void signOutAdmin().then(() => navigate({ to: "/admin/login" }));
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6">
          {tabs.map(({ to, label, Icon }) => {
            const active = path === to || path.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm transition ${
                  active
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>

      <PendingSyncToast />
    </div>
  );
}

function SyncBadge({ pendingCount }: { pendingCount: number }) {
  if (pendingCount > 0) {
    return (
      <span
        title={`${pendingCount} product change${pendingCount === 1 ? "" : "s"} not yet confirmed by the cloud.`}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd8a8] bg-[#fff5e8] px-3 py-1 text-xs font-medium text-[#a85d00]"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#a85d00]" />
        {pendingCount} pending sync
      </span>
    );
  }
  return (
    <span
      title="All changes are live in the cloud."
      className="inline-flex items-center gap-1.5 rounded-full border border-[#c4e8d2] bg-[#ecf8f1] px-3 py-1 text-xs font-medium text-[#1f7d57]"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#1f7d57]" />
      Synced
    </span>
  );
}
