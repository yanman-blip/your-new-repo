import { readFileSync, writeFileSync } from 'fs';

const map = JSON.parse(readFileSync('/tmp/image-map.json', 'utf8'));
const file = 'src/lib/product-folder-galleries.ts';
let src = readFileSync(file, 'utf8');

// Find every "..." string literal that looks like a local image path and replace
src = src.replace(/"((?:\\u[0-9a-fA-F]{4}|\\[^u]|[^"\\])+)"/g, (full, body) => {
  // decode JSON escapes
  let decoded;
  try { decoded = JSON.parse(full); } catch { return full; }
  if (typeof decoded !== 'string') return full;
  if (!decoded.startsWith('/') || !/\.(jpg|jpeg|png|webp|gif)$/i.test(decoded)) return full;
  const mapped = map[decoded];
  if (!mapped) {
    console.log('UNMAPPED:', decoded);
    return full;
  }
  return JSON.stringify(mapped);
});

writeFileSync(file, src);
const leftovers = (src.match(/"\/[^"]{3,}\.(jpg|jpeg|png|webp)"/gi) || []);
console.log(`Leftovers: ${leftovers.length}`);
