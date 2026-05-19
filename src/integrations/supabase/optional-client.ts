import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Returns the singleton Supabase client when the runtime has the required
 * env vars, or `null` when it doesn't. Lets call sites gracefully degrade
 * to local-only behaviour without sprinkling `as any` everywhere.
 */
export function getOptionalSupabase(): TypedSupabaseClient | null {
  try {
    // Touching any property forces the lazy Proxy in client.ts to construct
    // the real client. If env vars are missing it throws here and we return
    // null so the caller falls back to localStorage.
    void supabase.auth;
    return supabase;
  } catch {
    return null;
  }
}
