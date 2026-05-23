import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { buildPublicProductCatalog } from "./public-product-catalog.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(repoRoot, "public");

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

const rows = products.map((product) => ({
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