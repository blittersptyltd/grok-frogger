// Reads each turtle PNG and prints the bounding box of its non-transparent
// pixels, so we can verify the body is centered consistently across frames.
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SHEET = join(ROOT, "public/sprites/sheet-transparent.png");

const buf = await readFile(SHEET);
const png = PNG.sync.read(buf);

// For each turtle frame's row in the sheet, scan and report leftmost & rightmost
// non-transparent pixel within an x-range.
function bbox(yStart, yEnd, xStart, xEnd) {
  let minX = Infinity, maxX = -Infinity;
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const i = (y * png.width + x) * 4;
      if (png.data[i + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  return { minX, maxX, center: (minX + maxX) / 2, width: maxX - minX + 1 };
}

// Turtle row at y=138-152. Widened scans to include flipper extents.
// Bounds chosen so each scan stops at the gap between adjacent frames.
console.log("Frame A:", bbox(138, 152, 30, 58));
console.log("Frame B:", bbox(138, 152, 58, 82));
console.log("Frame C:", bbox(138, 152, 82, 112));
console.log("Dive   :", bbox(138, 152, 112, 130));
console.log("Submrgd:", bbox(138, 152, 130, 158));

// Log: scan only the left half of the sheet (the right half is alphabet glyphs).
console.log("\nLog scan rows (x=100-220):");
for (let y = 290; y <= 315; y++) {
  const b = bbox(y, y + 1, 100, 220);
  if (b.width > 0) console.log(`y=${y}: x=${b.minX}-${b.maxX} width=${b.width}`);
}
