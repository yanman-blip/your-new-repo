import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block w-6 h-6 rounded-full bg-gradient-to-br from-brand to-foreground" />
          <span>Orbit</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {nav.map((n) => (
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
          <button aria-label="Bag" className="hover:text-foreground transition-colors">
            <ShoppingBag className="w-4 h-4" />
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
          {nav.map((n) => (
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
          <div className="flex items-center gap-2 font-semibold mb-3">
            <span className="inline-block w-5 h-5 rounded-full bg-gradient-to-br from-brand to-foreground" />
            Orbit
          </div>
          <p className="text-muted-foreground">The world's flagship phones, in one place.</p>
        </div>
        {[
          { h: "Shop", l: ["Pro", "Standard", "Foldable", "Compact"] },
          { h: "Support", l: ["Help Center", "Repairs", "Trade-in", "Shipping"] },
          { h: "Company", l: ["About", "Press", "Careers", "Contact"] },
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
        <div className="mx-auto max-w-7xl px-6 py-5 text-xs text-muted-foreground flex justify-between">
          <span>© 2026 Orbit. All rights reserved.</span>
          <span>Made for the next era of mobile.</span>
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
    </div>
  );
}
