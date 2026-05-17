import { readFileSync, writeFileSync } from 'fs';

const map = JSON.parse(readFileSync('/tmp/image-map.json', 'utf8'));
const file = 'src/lib/products.ts';
let src = readFileSync(file, 'utf8');

let replaced = 0, missing = 0;
// Match JSON-like "image": "/...jpg" and any string literal occurrences
for (const [oldPath, newUrl] of Object.entries(map)) {
  // escape for regex (inside JSON string with escaped quotes etc.)
  const escaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`"${escaped}"`, 'g');
  const before = src.length;
  src = src.replace(re, `"${newUrl}"`);
  if (src.length !== before) replaced++;
  else missing++;
}

// Check for any leftover "/...jpg" patterns referencing public folder
const leftovers = src.match(/"\/[^"]*\.(jpg|jpeg|png|webp)"/gi) || [];
writeFileSync(file, src);
console.log(`Replaced groups: ${replaced}, not-found-in-source: ${missing}`);
console.log(`Leftover local image refs: ${leftovers.length}`);
if (leftovers.length) console.log(leftovers.slice(0, 5));
