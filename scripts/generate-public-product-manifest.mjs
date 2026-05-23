import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPublicProductCatalog } from "./public-product-catalog.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(repoRoot, "public");
const imageOutputPath = path.join(repoRoot, "src", "lib", "public-product-images.generated.ts");
const productOutputPath = path.join(repoRoot, "src", "lib", "public-products.generated.ts");

async function main() {
  const { galleries, variants, products } = await buildPublicProductCatalog(publicRoot);

  const imageFileContents = `export type PublicProductGalleryManifest = Record<string, string[]>;\nexport type PublicProductVariantManifest = Record<string, Record<string, string[]>>;\n\nexport const publicProductGalleryManifest: PublicProductGalleryManifest = ${JSON.stringify(galleries, null, 2)} as const;\n\nexport const publicProductVariantManifest: PublicProductVariantManifest = ${JSON.stringify(variants, null, 2)} as const;\n`;

  const productFileContents = `export type PublicGeneratedProduct = {\n  id: string;\n  name: string;\n  brand: string;\n  productType: \"Night Wear\" | \"Bra & Pant\" | \"Sexy Lingerie\" | \"Sexy Night Wear\";\n  price: number;\n  image: string;\n  gallery: string[];\n  storage: string[];\n  colors: { name: string; hex: string }[];\n  highlights: string[];\n  badge?: string;\n};\n\nexport const publicGeneratedProducts: PublicGeneratedProduct[] = ${JSON.stringify(products, null, 2)} as const;\n`;

  await writeFile(imageOutputPath, imageFileContents, "utf8");
  await writeFile(productOutputPath, productFileContents, "utf8");
  console.log(`Wrote ${imageOutputPath}`);
  console.log(`Wrote ${productOutputPath}`);
}

await main();