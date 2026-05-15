import { supabase } from "@/integrations/supabase/client";

export type AdminSessionResult = {
  ok: boolean;
  reason?: "no_session" | "not_admin" | "missing_config";
};

function getOptionalSupabase(): any | null {
  try {
    return supabase as any;
  } catch {
    return null;
  }
}

export async function hasAdminSession(): Promise<AdminSessionResult> {
  const client = getOptionalSupabase();
  if (!client) return { ok: false, reason: "missing_config" };
  try {
    const { data: sessionData } = await client.auth.getSession();
    const session = sessionData?.session;
    if (!session?.user?.id) return { ok: false, reason: "no_session" };

    const { data, error } = await client
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (error) return { ok: false, reason: "not_admin" };
    return { ok: data?.role === "admin", reason: data?.role === "admin" ? undefined : "not_admin" };
  } catch {
    return { ok: false, reason: "missing_config" };
  }
}

export async function signInAdmin(email: string, password: string) {
  const client = getOptionalSupabase();
  if (!client) throw new Error("Invalid login attempt.");

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Invalid login attempt.");

  const check = await hasAdminSession();
  if (!check.ok) {
    await client.auth.signOut();
    throw new Error("Invalid login attempt.");
  }
}

export async function signOutAdmin() {
  const client = getOptionalSupabase();
  if (!client) return;
  await client.auth.signOut();
}
