import { readFileSync, writeFileSync } from 'fs';

const map = JSON.parse(readFileSync('/tmp/image-map.json', 'utf8'));
const files = ['src/lib/products.ts', 'src/lib/product-folder-galleries.ts', 'src/lib/product-image-storage.ts'];

for (const file of files) {
  let src;
  try { src = readFileSync(file, 'utf8'); } catch { continue; }
  let replacedCount = 0;
  for (const [oldPath, newUrl] of Object.entries(map)) {
    // try both literal and \u0027-escaped apostrophe variants
    const variants = new Set([oldPath, oldPath.replace(/'/g, "\\u0027")]);
    for (const v of variants) {
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`"${escaped}"`, 'g');
      const before = src;
      src = src.replace(re, `"${newUrl}"`);
      if (src !== before) replacedCount++;
    }
  }
  const leftovers = (src.match(/"\/[^"]*\.(jpg|jpeg|png|webp)"/gi) || []).filter(s => !s.includes('http'));
  writeFileSync(file, src);
  console.log(`${file}: replaced ${replacedCount}, leftovers ${leftovers.length}`);
  if (leftovers.length) console.log('  e.g.', leftovers[0]);
}
