// Finds every distinct sprite in sheet-v2.png by flood-filling connected
// non-black pixel regions. Outputs each blob's bounding box, sorted by row.
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SHEET = join(ROOT, "public/sprites/sheet-v2-transparent.png");

const buf = await readFile(SHEET);
const png = PNG.sync.read(buf);
const W = png.width, H = png.height;

function isContent(x, y) {
  if (x < 0 || x >= W || y < 0 || y >= H) return false;
  const i = (y * W + x) * 4;
  return png.data[i + 3] > 0;
}

// 4-connected (only directly adjacent pixels) — distinct sprites stay separate.
function neighbors(x, y) {
  return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
}

const visited = new Uint8Array(W * H);
const blobs = [];

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (visited[y * W + x]) continue;
    if (!isContent(x, y)) continue;
    // Flood-fill (BFS)
    let minX = x, maxX = x, minY = y, maxY = y, count = 0;
    const queue = [[x, y]];
    visited[y * W + x] = 1;
    while (queue.length) {
      const [cx, cy] = queue.pop();
      count++;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
      for (const [nx, ny] of neighbors(cx, cy)) {
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        if (visited[ny * W + nx]) continue;
        if (!isContent(nx, ny)) continue;
        visited[ny * W + nx] = 1;
        queue.push([nx, ny]);
      }
    }
    if (count >= 6) {
      blobs.push({ minX, maxX, minY, maxY, count, w: maxX - minX + 1, h: maxY - minY + 1 });
    }
  }
}

// Sort by row (minY), then by x (minX).
blobs.sort((a, b) => {
  const rowA = Math.floor(a.minY / 16) * 16;
  const rowB = Math.floor(b.minY / 16) * 16;
  if (rowA !== rowB) return rowA - rowB;
  return a.minX - b.minX;
});

// Group by approximate row.
let lastRow = -100;
for (const b of blobs) {
  if (Math.abs(b.minY - lastRow) > 8) {
    console.log(`\n--- y≈${b.minY} ---`);
    lastRow = b.minY;
  }
  console.log(
    `(${b.minX},${b.minY}) ${b.w}×${b.h}  count=${b.count}`
  );
}
console.log(`\n${blobs.length} sprites found.`);
