// Scans sheet-v2.png and prints the bounding box of every connected blob of
// non-transparent pixels (a "sprite"), grouped by row.
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SHEET = join(ROOT, "public/sprites/sheet-v2.png");

const buf = await readFile(SHEET);
const png = PNG.sync.read(buf);
console.log(`Sheet: ${png.width} × ${png.height}`);

// Sheet has a black BG, not transparent. "Content" = any non-pure-black pixel.
function isContent(i) {
  return !(png.data[i] === 0 && png.data[i + 1] === 0 && png.data[i + 2] === 0);
}

const rowCounts = [];
for (let y = 0; y < png.height; y++) {
  let count = 0;
  for (let x = 0; x < png.width; x++) {
    if (isContent((y * png.width + x) * 4)) count++;
  }
  rowCounts.push(count);
}

// Find horizontal "bands" of content: consecutive rows with >0 pixels.
const bands = [];
let bandStart = -1;
for (let y = 0; y < rowCounts.length; y++) {
  if (rowCounts[y] > 0) {
    if (bandStart === -1) bandStart = y;
  } else {
    if (bandStart !== -1) {
      bands.push({ y0: bandStart, y1: y - 1 });
      bandStart = -1;
    }
  }
}
if (bandStart !== -1) bands.push({ y0: bandStart, y1: rowCounts.length - 1 });

console.log(`\nContent bands (${bands.length}):`);
for (const b of bands) {
  console.log(`  y=${b.y0}-${b.y1} (h=${b.y1 - b.y0 + 1})`);
}
