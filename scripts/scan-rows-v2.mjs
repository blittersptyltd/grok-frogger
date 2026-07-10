// For each row of sprites in sheet-v2-transparent.png, scan and report each
// sprite's tight bbox (leftmost / rightmost non-transparent pixel per blob).
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SHEET = join(ROOT, "public/sprites/sheet-v2-transparent.png");
const buf = await readFile(SHEET);
const png = PNG.sync.read(buf);

function rowSprites(y0, y1, label) {
  // Find runs of x-columns that contain at least one non-transparent pixel.
  const cols = new Uint8Array(png.width);
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] > 0) cols[x] = 1;
    }
  }
  // Identify runs separated by ≥3 empty columns
  const sprites = [];
  let runStart = -1, gap = 0;
  for (let x = 0; x <= png.width; x++) {
    if (x < png.width && cols[x]) {
      if (runStart === -1) runStart = x;
      gap = 0;
    } else {
      gap++;
      if (runStart !== -1 && gap >= 2) {
        sprites.push({ x: runStart, w: x - gap - runStart });
        runStart = -1;
      }
    }
  }
  // For each x-range, find its precise y-range too.
  console.log(`\n${label} (y=${y0}-${y1}):`);
  for (const s of sprites) {
    let minY = Infinity, maxY = -Infinity;
    for (let y = y0; y <= y1; y++) {
      for (let x = s.x; x < s.x + s.w; x++) {
        if (png.data[(y * png.width + x) * 4 + 3] > 0) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    console.log(`  x=${s.x}, y=${minY}, w=${s.w}, h=${maxY - minY + 1}`);
  }
}

rowSprites(2, 17, "Row 1 (green frogs U/D/L/R × idle/hop)");
rowSprites(20, 35, "Row 2 (cyan/pink lady frogs)");
rowSprites(38, 53, "Row 3 (red 'invisible' lady frogs)");
rowSprites(80, 96, "Row 4 (lady frog death + explosions + skull)");
rowSprites(99, 113, "Row 5 (small attract-mode frogs)");
rowSprites(116, 132, "Row 6 (cars)");
rowSprites(135, 156, "Row 7 (logs + alligators)");
rowSprites(155, 172, "Row 8 (turtles + otters)");
rowSprites(172, 192, "Row 9 (snakes)");
rowSprites(195, 215, "Row 10 (homes/alligator/lady)");
