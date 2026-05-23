import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  ShoppingBag,
  Menu,
  User,
  Globe,
  Headset,
  TicketPercent,
  Home,
  LayoutGrid,
  Sparkles,
  Heart,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useOptionalCart } from "@/lib/cart";
import { CartDrawer } from "./cart-drawer";
import { hasAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/integrations/supabase/client";
import { SearchCommand } from "@/components/search-command";
import { getProductTypeSlug } from "@/lib/product-taxonomy";

type NavItem = {
  to: "/" | "/shop" | "/wishlist" | "/about" | "/contact" | "/admin/orders" | "/collections/$slug";
  label: string;
  search?: Record<string, string>;
  params?: { slug: string };
  adminOnly?: boolean;
};

const nav: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/wishlist", label: "Wishlist" },
  {
    to: "/collections/$slug",
    label: "Night Wear",
    params: { slug: getProductTypeSlug("Night Wear") },
  },
  {
    to: "/collections/$slug",
    label: "Bra & Pant",
    params: { slug: getProductTypeSlug("Bra & Pant") },
  },
  {
    to: "/collections/$slug",
    label: "Sexy Lingerie",
    params: { slug: getProductTypeSlug("Sexy Lingerie") },
  },
  {
    to: "/collections/$slug",
    label: "Sexy Night Wear",
    params: { slug: getProductTypeSlug("Sexy Night Wear") },
  },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/admin/orders", label: "Admin", adminOnly: true },
];

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const cart = useOptionalCart();
  const count = cart?.count ?? 0;
  const setCartOpen = cart?.setOpen ?? (() => {});

  useEffect(() => {
    let mounted = true;
    void hasAdminSession().then((result) => {
      if (mounted) setIsAdmin(result.ok);
    });
    let unsubscribe: (() => void) | undefined;
    try {
      void supabase.auth.getUser().then(({ data }) => {
        if (mounted) setIsAuthed(!!data.user);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (mounted) setIsAuthed(!!session?.user);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    } catch {
      if (mounted) setIsAuthed(false);
    }
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const visibleNav = nav.filter((n) => (n.adminOnly ? isAdmin : true));

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="bg-[#111] text-white">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-center gap-3 px-6 text-[11px] font-medium uppercase tracking-[0.18em]">
          <span className="inline-flex items-center gap-1.5"><Truck className="h-3 w-3" /> Express 2&ndash;10 days</span>
          <span className="opacity-50">·</span>
          <span className="hidden sm:inline">Free delivery over $49</span>
          <span className="opacity-50 hidden md:inline">·</span>
          <span className="hidden md:inline">New edits weekly</span>
        </div>
      </div>

      <div className="hidden border-b border-border/70 bg-[#fafafa] md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-end gap-6 px-6 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Headset className="h-3.5 w-3.5" /> Support
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> EN / USD
          </span>
          <Link to={isAuthed ? "/account/orders" : "/auth"} className="hover:text-foreground">
            {isAuthed ? "My Orders" : "Sign In"}
          </Link>
        </div>
      </div>

      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 md:px-6">
        <button
          aria-label="Menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="justify-self-start md:justify-self-center">
          <span className="text-xl font-bold uppercase tracking-[0.18em] md:text-2xl md:tracking-[0.22em]">
            Wet Lace
          </span>
        </Link>

        <div className="flex items-center justify-self-end gap-2 text-muted-foreground">
          <SearchCommand />
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-border hover:text-foreground transition-colors md:inline-flex"
          >
            <Heart className="h-4 w-4" />
          </Link>
          <Link
            to={isAuthed ? "/account/orders" : "/auth"}
            aria-label={isAuthed ? "My orders" : "Sign in"}
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-border hover:text-foreground transition-colors md:inline-flex"
          >
            <User className="h-4 w-4" />
          </Link>
          <button
            aria-label="Bag"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:text-foreground transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] leading-none text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="hidden border-t border-border/70 md:block">
        <nav className="mx-auto flex h-12 max-w-7xl items-center gap-7 overflow-x-auto px-6 text-sm font-medium">
          {visibleNav.map((n) => (
            <Link
              key={`${n.to}-${n.label}`}
              to={n.to}
              search={n.search}
              params={n.params}
              className={`whitespace-nowrap border-b-2 py-3 transition-colors ${path === n.to ? "border-black text-black" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>

      {open && (
        <div className="border-t border-border/50 px-4 py-4 md:hidden">
          <nav className="grid grid-cols-2 gap-2 text-sm">
            {visibleNav.map((n) => (
              <Link
                key={`${n.to}-mobile-${n.label}`}
                to={n.to}
                search={n.search}
                params={n.params}
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-3 py-2 text-muted-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const footerSections = [
    {
      heading: "Shop",
      links: [
        { label: "New In", to: "/shop" as const, search: { sort: "newest" } },
        {
          label: "Best Sellers",
          to: "/collections/$slug" as const,
          params: { slug: getProductTypeSlug("Sexy Lingerie") },
        },
        { label: "Sale", to: "/shop" as const, search: { sort: "low" } },
        { label: "Curves", to: "/shop" as const, search: { q: "plus size" } },
      ],
    },
    {
      heading: "Help",
      links: [
        { label: "Size Guide", to: "/size-guide" as const },
        { label: "Shipping", to: "/shipping" as const },
        { label: "Returns", to: "/returns" as const },
        { label: "Track Order", to: "/track-order" as const },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "Our Story", to: "/story" as const },
        { label: "About", to: "/about" as const },
        { label: "Contact", to: "/contact" as const },
        { label: "Wishlist", to: "/wishlist" as const },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-border/70 bg-[#fafafa]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 text-sm md:grid-cols-4">
        <div>
          <div className="mb-3 text-base font-bold uppercase tracking-[0.22em]">
            Wet Lace
          </div>
          <p className="text-muted-foreground italic font-display">
            Considered lingerie, sleepwear and lounge. Handpicked from each season for the ones who don't behave.
          </p>
        </div>
        {footerSections.map((section) => (
          <div key={section.heading}>
            <div className="font-medium mb-3">{section.heading}</div>
            <ul className="space-y-2 text-muted-foreground">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    search={link.search}
                    params={link.params}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-6 py-5 text-xs text-muted-foreground">
          <span>© 2026 WET LACE. All rights reserved.</span>
          <span>Based in Harare, Zimbabwe.</span>
        </div>
      </div>
    </footer>
  );
}

export function MobileBottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search });
  const cart = useOptionalCart();
  const count = cart?.count ?? 0;
  const setCartOpen = cart?.setOpen ?? (() => {});
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    try {
      void supabase.auth.getSession().then(({ data }) => {
        if (mounted) setIsAuthed(!!data.session?.user);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (mounted) setIsAuthed(!!session?.user);
      });
      return () => {
        mounted = false;
        sub.subscription.unsubscribe();
      };
    } catch {
      if (mounted) setIsAuthed(false);
      return () => {
        mounted = false;
      };
    }
  }, []);

  const isActive = (target: string, requiredSearch?: Record<string, string>) => {
    if (path !== target) return false;
    if (!requiredSearch) return true;
    const current = search as Record<string, unknown>;
    return Object.entries(requiredSearch).every(([key, value]) => current?.[key] === value);
  };

  const isNewActive = path === "/shop" && (search as Record<string, unknown>)?.sort === "newest";

  const accountTarget = isAuthed ? "/account/orders" : "/auth";

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5 text-[10px] font-medium text-muted-foreground">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 py-2 ${isActive("/") ? "text-foreground" : ""}`}
        >
          <Home className="h-5 w-5" />
          Home
        </Link>
        <Link
          to="/shop"
          className={`flex flex-col items-center gap-0.5 py-2 ${path === "/shop" && !isNewActive ? "text-foreground" : ""}`}
        >
          <LayoutGrid className="h-5 w-5" />
          Shop
        </Link>
        <Link
          to="/shop"
          search={{ sort: "newest" }}
          className={`flex flex-col items-center gap-0.5 py-2 ${isNewActive ? "text-foreground" : ""}`}
        >
          <Sparkles className="h-5 w-5" />
          New
        </Link>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="relative flex flex-col items-center gap-0.5 py-2"
        >
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] leading-none text-background">
                {count}
              </span>
            )}
          </span>
          Cart
        </button>
        <Link
          to="/wishlist"
          className={`flex flex-col items-center gap-0.5 py-2 ${path === "/wishlist" ? "text-foreground" : ""}`}
        >
          <Heart className="h-5 w-5" />
          Wishlist
        </Link>
        <Link
          to={accountTarget}
          className={`flex flex-col items-center gap-0.5 py-2 ${path.startsWith("/account") || path === "/auth" ? "text-foreground" : ""}`}
        >
          <User className="h-5 w-5" />
          Me
        </Link>
      </div>
    </nav>
  );
}

export function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
      <SiteHeader />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <CartDrawer />
      <MobileBottomNav />
    </div>
  );
}
