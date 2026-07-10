// Renders sheet-transparent.png onto a magenta background with a 5px-grid
// overlay and coordinate labels every 20px, so we can read sprite boundaries
// pixel-by-pixel by eye.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SHEET = join(ROOT, "public/sprites/sheet-transparent.png");
const OUT = "/tmp/grid_overlay.png";
const SCALE = 4;

const sheetBuf = await readFile(SHEET);
const sheet = PNG.sync.read(sheetBuf);

const w = sheet.width * SCALE;
const h = sheet.height * SCALE;
const out = new PNG({ width: w, height: h });

// Fill magenta background so transparent areas are visible
for (let i = 0; i < out.data.length; i += 4) {
  out.data[i] = 60;
  out.data[i + 1] = 60;
  out.data[i + 2] = 60;
  out.data[i + 3] = 255;
}

// Upscale the sheet (nearest-neighbor)
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const sx = (x / SCALE) | 0;
    const sy = (y / SCALE) | 0;
    const srcIdx = (sy * sheet.width + sx) * 4;
    const a = sheet.data[srcIdx + 3];
    if (a > 0) {
      const dstIdx = (y * w + x) * 4;
      out.data[dstIdx] = sheet.data[srcIdx];
      out.data[dstIdx + 1] = sheet.data[srcIdx + 1];
      out.data[dstIdx + 2] = sheet.data[srcIdx + 2];
      out.data[dstIdx + 3] = 255;
    }
  }
}

// Draw 10px grid lines (every 10 source pixels)
const LINE_INTERVAL = 10;
for (let sy = 0; sy <= sheet.height; sy += LINE_INTERVAL) {
  const dy = sy * SCALE;
  for (let dx = 0; dx < w; dx++) {
    const i = (dy * w + dx) * 4;
    out.data[i] = 255;
    out.data[i + 1] = 0;
    out.data[i + 2] = 255;
    out.data[i + 3] = 80; // semi-transparent overlay
  }
}
for (let sx = 0; sx <= sheet.width; sx += LINE_INTERVAL) {
  const dx = sx * SCALE;
  for (let dy = 0; dy < h; dy++) {
    const i = (dy * w + dx) * 4;
    out.data[i] = 255;
    out.data[i + 1] = 0;
    out.data[i + 2] = 255;
    out.data[i + 3] = 80;
  }
}

await writeFile(OUT, PNG.sync.write(out));
console.log(`Wrote ${OUT} (${w}×${h})`);
