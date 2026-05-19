import { supabase } from "@/integrations/supabase/client";

export type AdminSessionResult = {
  ok: boolean;
  reason?: "no_session" | "not_admin" | "missing_config";
};

export async function hasAdminSession(): Promise<AdminSessionResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session?.user?.id) return { ok: false, reason: "no_session" };

    // Roles live in user_roles (separate from profiles to prevent privilege escalation).
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error) return { ok: false, reason: "not_admin" };
    return { ok: !!data, reason: data ? undefined : "not_admin" };
  } catch {
    return { ok: false, reason: "missing_config" };
  }
}

export async function signInAdmin(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Invalid login attempt.");

  const check = await hasAdminSession();
  if (!check.ok) {
    await supabase.auth.signOut();
    throw new Error("Invalid login attempt.");
  }
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}
