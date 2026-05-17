import { supabase } from "@/integrations/supabase/client";

const PAYMENT_PROOFS_BUCKET = "payment-proofs";

function getOptionalSupabase(): any | null {
  try {
    return supabase as any;
  } catch {
    return null;
  }
}

function safeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}

export async function uploadProofToStorage(file: File, orderId: string): Promise<{ fileName: string; fileUrl: string; storagePath: string }> {
  const client = getOptionalSupabase();
  if (!client) {
    throw new Error("Supabase is not configured for proof upload.");
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const storagePath = `orders/${orderId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(file.name)}.${ext}`;

  const { error } = await client.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .upload(storagePath, file, { upsert: false, cacheControl: "3600", contentType: file.type || "application/octet-stream" });

  if (error) {
    throw new Error(`Upload failed for ${file.name}: ${error.message}`);
  }

  const { data: publicUrlData } = client.storage.from(PAYMENT_PROOFS_BUCKET).getPublicUrl(storagePath);
  const fileUrl = publicUrlData?.publicUrl;
  if (!fileUrl) {
    throw new Error(`Could not build public URL for ${file.name}`);
  }

  return {
    fileName: file.name,
    fileUrl,
    storagePath,
  };
}