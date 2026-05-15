import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { signInAdmin } from "@/lib/admin-auth";

const ADMIN_LOGIN_FAIL_COUNT_KEY = "admin-login-fail-count";
const ADMIN_LOGIN_LOCK_UNTIL_KEY = "admin-login-lock-until";
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;

function getStoredNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  const value = window.sessionStorage.getItem(key);
  const parsed = value ? Number(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function setStoredNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, String(value));
}

function clearLockState() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ADMIN_LOGIN_FAIL_COUNT_KEY);
  window.sessionStorage.removeItem(ADMIN_LOGIN_LOCK_UNTIL_KEY);
}

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login - Joy's Closet" },
      { name: "description", content: "Sign in to the Joy's Closet admin portal." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [lockUntilMs, setLockUntilMs] = useState<number>(() => getStoredNumber(ADMIN_LOGIN_LOCK_UNTIL_KEY));

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isLocked = lockUntilMs > nowMs;
  const remainingSeconds = useMemo(() => Math.max(0, Math.ceil((lockUntilMs - nowMs) / 1000)), [lockUntilMs, nowMs]);

  const registerFailedAttempt = () => {
    const currentFails = getStoredNumber(ADMIN_LOGIN_FAIL_COUNT_KEY) + 1;
    if (currentFails >= MAX_FAILED_ATTEMPTS) {
      const nextLockUntil = Date.now() + LOCK_DURATION_MS;
      setStoredNumber(ADMIN_LOGIN_LOCK_UNTIL_KEY, nextLockUntil);
      setStoredNumber(ADMIN_LOGIN_FAIL_COUNT_KEY, 0);
      setLockUntilMs(nextLockUntil);
      setError("Too many attempts. Try again in 5 minutes.");
      return;
    }

    setStoredNumber(ADMIN_LOGIN_FAIL_COUNT_KEY, currentFails);
    setError("Invalid email or password.");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setError(`Too many attempts. Try again in ${remainingSeconds}s.`);
      return;
    }

    setError("");
    setLoading(true);
    try {
      await signInAdmin(email.trim(), password);
      clearLockState();
      await navigate({ to: "/admin/orders" });
    } catch {
      registerFailedAttempt();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to store
      </Link>

      <div className="mt-6 rounded-2xl border border-border bg-background p-6">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with your admin email and password.</p>

        <form className="mt-5 grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
              placeholder="admin@example.com"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
              placeholder="Your password"
            />
          </label>

          <button
            type="submit"
            disabled={loading || isLocked}
            className="mt-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : isLocked ? `Locked (${remainingSeconds}s)` : "Sign in"}
          </button>
        </form>

        {error && <p className="mt-3 rounded-lg bg-[#fff1f1] px-3 py-2 text-sm text-[#b42318]">{error}</p>}
      </div>
    </section>
  );
}
