import { getOptionalSupabase } from "@/integrations/supabase/optional-client";
import type { Json } from "@/integrations/supabase/types";

type CloudSettingValue = Json;

export async function fetchCloudSetting<T extends CloudSettingValue>(key: string): Promise<T | null> {
  const client = getOptionalSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("store_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) return null;
    return (data.value as T) ?? null;
  } catch {
    return null;
  }
}

export async function upsertCloudSetting<T extends CloudSettingValue>(key: string, value: T): Promise<boolean> {
  const client = getOptionalSupabase();
  if (!client) return false;

  try {
    const { error } = await client
      .from("store_settings")
      .upsert({ key, value }, { onConflict: "key" });

    return !error;
  } catch {
    return false;
  }
}