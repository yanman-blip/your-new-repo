import { getOptionalSupabase } from "@/integrations/supabase/optional-client";

const PRODUCT_IMAGES_BUCKET = "product-images";

function safeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}

export async function uploadProductImagesToStorage(files: File[], folderHint = "admin"): Promise<string[]> {
  const client = getOptionalSupabase();
  if (!client) {
    throw new Error("Supabase is not configured for image upload.");
  }

  const uploaded: string[] = [];
  for (const file of files) {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const objectPath = `${folderHint}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(file.name)}.${ext}`;

    const { error } = await client.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(objectPath, file, { upsert: false, cacheControl: "3600", contentType: file.type || "image/jpeg" });

    if (error) {
      throw new Error(`Upload failed for ${file.name}: ${error.message}`);
    }

    const { data: publicUrlData } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath);
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      throw new Error(`Could not build public URL for ${file.name}`);
    }

    uploaded.push(publicUrl);
  }

  return uploaded;
}
