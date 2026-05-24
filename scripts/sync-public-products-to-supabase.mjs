import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { buildPublicProductCatalog } from "./public-product-catalog.mjs";

const STORAGE_BUCKET = "product-images";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(repoRoot, "public");

function isStorageUrl(url) {
  if (!url) return false;
  return url.includes("/storage/v1/object/public/");
}

function resolveLocalPath(imageUrl) {
  const segments = imageUrl
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  return path.join(publicRoot, ...segments);
}

async function uploadImagesForProduct(product) {
  const gallery = Array.isArray(product.gallery) && product.gallery.length > 0
    ? product.gallery
    : product.image
      ? [product.image]
      : [];

  const uploadedGallery = [];

  for (const url of gallery) {
    if (isStorageUrl(url)) {
      uploadedGallery.push(url);
      continue;
    }

    const localPath = resolveLocalPath(url);
    if (!existsSync(localPath)) {
      throw new Error(`Missing local image for ${product.id}: ${localPath}`);
    }

    const filename = path.basename(localPath);
    const objectPath = `auto/${product.id}/${filename}`;
    const buffer = await readFile(localPath);
    const contentType = filename.toLowerCase().endsWith(".png")
      ? "image/png"
      : filename.toLowerCase().endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";

    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(objectPath, buffer, {
        upsert: true,
        cacheControl: "31536000",
        contentType,
      });

    if (uploadError && !/already exists/i.test(uploadError.message)) {
      throw new Error(`Upload failed for ${product.id}/${filename}: ${uploadError.message}`);
    }

    const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
    if (!data?.publicUrl) {
      throw new Error(`Could not build public URL for ${product.id}/${filename}`);
    }

    uploadedGallery.push(data.publicUrl);
  }

  return {
    ...product,
    image: uploadedGallery[0] ?? product.image,
    gallery: uploadedGallery,
  };
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
}

const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    storage: undefined,
  },
});

const { products } = await buildPublicProductCatalog(publicRoot);
if (products.length === 0) {
  throw new Error("No products were found under the public folder.");
}

console.log(`Uploading product images for ${products.length} public-folder products...`);

const readyProducts = [];
for (const product of products) {
  console.log(`  · ${product.id}`);
  readyProducts.push(await uploadImagesForProduct(product));
}

const rows = readyProducts.map((product) => ({
  id: product.id,
  name: product.name,
  brand: product.brand,
  price: product.price,
  image: product.image,
  is_published: true,
  payload: product,
}));

const { error: deleteError } = await client.from("products").delete().not("id", "is", null);
if (deleteError) throw new Error(`Failed to clear products table: ${deleteError.message}`);

const { error: insertError } = await client.from("products").insert(rows);
if (insertError) throw new Error(`Failed to insert public products: ${insertError.message}`);

console.log(`Replaced Supabase products with ${rows.length} public-folder products.`);