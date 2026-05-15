import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in - LOFTIE" },
      { name: "description", content: "Sign in to LOFTIE to track orders and check out faster." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (err) throw err;
        setInfo("Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        await navigate({ to: "/" });
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    setEmail("");
    setPassword("");
  };

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to LOFTIE
      </Link>

      <div className="mt-6 rounded-2xl border border-border bg-background p-6">
        {user ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">Signed in as {user.email}</p>
            <button
              onClick={onSignOut}
              className="mt-5 w-full rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Welcome back to LOFTIE."
                : "Track your orders and check out faster."}
            </p>

            <form className="mt-5 grid gap-3" onSubmit={onSubmit}>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  placeholder="you@example.com"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  placeholder="At least 8 characters"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            {error && <p className="mt-3 rounded-lg bg-[#fff1f1] px-3 py-2 text-sm text-[#b42318]">{error}</p>}
            {info && <p className="mt-3 rounded-lg bg-[#f0f9ff] px-3 py-2 text-sm text-[#075985]">{info}</p>}

            <button
              onClick={() => {
                setError("");
                setInfo("");
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "signin" ? "New to LOFTIE? Create an account" : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
