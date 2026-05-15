import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "./cart-drawer";
import { hasAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/admin/orders", label: "Admin" },
] as const;

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    let mounted = true;
    void hasAdminSession().then((result) => {
      if (mounted) setIsAdmin(result.ok);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const visibleNav = nav.filter((n) => (n.to === "/admin/orders" ? isAdmin : true));

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-sm">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold tracking-normal">
            JC
          </span>
          <span className="tracking-[0.14em] uppercase">Joy's Closet</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {visibleNav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`transition-colors hover:text-foreground ${path === n.to ? "text-foreground" : "text-muted-foreground"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-muted-foreground">
          <button aria-label="Search" className="hover:text-foreground transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button
            aria-label="Bag"
            onClick={() => setCartOpen(true)}
            className="relative hover:text-foreground transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-foreground text-background text-[10px] leading-none rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
          <button
            aria-label="Menu"
            className="md:hidden hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/50 px-6 py-4 flex flex-col gap-3 text-sm">
          {visibleNav.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="text-muted-foreground">
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="mb-3 flex items-center gap-2 font-semibold text-sm">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold tracking-normal">
              JC
            </span>
            <span className="tracking-[0.14em] uppercase">Joy's Closet</span>
          </div>
          <p className="text-muted-foreground">Lingerie, sleepwear and lounge. Based in Harare, Zimbabwe.</p>
        </div>
        {[
          { h: "Shop", l: ["Lace", "Silk", "Lounge", "Everyday"] },
          { h: "Care", l: ["Size guide", "Fabric care", "Returns", "Shipping"] },
          { h: "Atelier", l: ["About", "Journal", "Sustainability", "Contact"] },
        ].map((c) => (
          <div key={c.h}>
            <div className="font-medium mb-3">{c.h}</div>
            <ul className="space-y-2 text-muted-foreground">
              {c.l.map((i) => (
                <li key={i} className="hover:text-foreground transition-colors cursor-pointer">{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6 py-5 text-xs text-muted-foreground flex flex-wrap gap-2 justify-between">
          <span>© 2026 Joy's Closet. All rights reserved.</span>
          <span>Based in Harare, Zimbabwe.</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <CartDrawer />
    </div>
  );
}
