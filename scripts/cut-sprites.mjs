// Slices public/sprites/sheet-v2-transparent.png into individually-named PNG
// files based on the SPRITES config below. Run this whenever the sheet or
// the rect config changes:
//
//   node scripts/key-out-black.mjs   # re-key if sheet-v2.png was replaced
//   node scripts/cut-sprites.mjs     # then re-cut

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SHEET = join(ROOT, "public/sprites/sheet-v2-transparent.png");
const OUT_DIR = join(ROOT, "public/sprites/cut");

// Sprite sheet uses 16-wide cells with 2-px gaps between for the frog rows.
// Vehicle/log rows use slightly different cell sizes — tight bboxes verified
// by scripts/scan-rows-v2.mjs.
const SPRITES = [
  // Row 1 — green frog (idle/hop in 4 directions). Cells at stride 18.
  { name: "frog_idle",      x: 0,   y: 0,   w: 16, h: 16 },
  { name: "frog_hop",       x: 18,  y: 0,   w: 16, h: 16 },

  // Row 4 — death frames at y=80-96.
  { name: "frog_drown_1",   x: 56,  y: 80,  w: 16, h: 16 },
  { name: "frog_drown_2",   x: 73,  y: 80,  w: 16, h: 16 },
  { name: "frog_drown_3",   x: 90,  y: 80,  w: 16, h: 16 },
  { name: "frog_squash",    x: 109, y: 80,  w: 16, h: 16 },

  // Row 6 — vehicles at y=116-132. All face RIGHT in the sheet.
  { name: "car_purple",     x: 0,   y: 116, w: 16, h: 16 }, // pink/cyan
  { name: "car_yellow",     x: 18,  y: 116, w: 16, h: 16 },
  { name: "car_green",      x: 36,  y: 116, w: 16, h: 16 },
  { name: "car_white",      x: 54,  y: 116, w: 16, h: 16 }, // race car
  { name: "truck",          x: 72,  y: 116, w: 32, h: 16 }, // 2-cell wide

  // Row 7 — log sections at y=135-156. 1st cell is left end (rounded-left cap),
  // 2nd is tileable bark middle, 3rd is right end (rounded-right cap).
  { name: "log_l",          x: 0,   y: 135, w: 16, h: 22 },
  { name: "log_m",          x: 18,  y: 135, w: 16, h: 22 },
  { name: "log_r",          x: 36,  y: 135, w: 16, h: 22 },

  // Row 8 — turtle paddle cycle + dive frames at y=155-172.
  { name: "turtle_a",         x: 0,   y: 154, w: 16, h: 16 },
  { name: "turtle_b",         x: 18,  y: 154, w: 16, h: 16 },
  { name: "turtle_c",         x: 36,  y: 154, w: 16, h: 16 },
  { name: "turtle_dive",      x: 54,  y: 154, w: 16, h: 16 },
  { name: "turtle_submerged", x: 72,  y: 154, w: 16, h: 16 },

  // Row 10 — front-facing seated frog used in filled home alcoves.
  { name: "frog_in_home",   x: 45,  y: 197, w: 16, h: 15 },
  // Bonus fly — tight crop of the insect only (exclude green hedge bleed below).
  { name: "bonus_fly",      x: 85,  y: 200, w: 10, h: 9 },
  // Open-mouth crocodile HEAD for home-alcove hazard only.
  { name: "croc_head",      x: 117, y: 196, w: 15, h: 16 },
  // Full-body river crocodile (replaces some long logs).
  { name: "croc_body",      x: 56,  y: 134, w: 46, h: 16 },
  // Snake animation frames (median / bank hazard).
  { name: "snake_a",        x: 4,   y: 172, w: 27, h: 11 },
  { name: "snake_b",        x: 37,  y: 174, w: 29, h: 9 },
  { name: "snake_c",        x: 70,  y: 177, w: 29, h: 6 },
  // Lady frog (pink) — idle facing up, for log bonus.
  { name: "lady_frog",      x: 0,   y: 18,  w: 16, h: 16 },
];

async function main() {
  const sheetBuf = await readFile(SHEET);
  const sheet = PNG.sync.read(sheetBuf);
  console.log(`Sheet: ${sheet.width} × ${sheet.height}`);
  await mkdir(OUT_DIR, { recursive: true });

  for (const s of SPRITES) {
    if (s.x + s.w > sheet.width || s.y + s.h > sheet.height) {
      console.error(`✗ ${s.name}: rect out of bounds`);
      continue;
    }
    const out = new PNG({ width: s.w, height: s.h });
    for (let y = 0; y < s.h; y++) {
      for (let x = 0; x < s.w; x++) {
        const srcIdx = ((s.y + y) * sheet.width + (s.x + x)) * 4;
        const dstIdx = (y * s.w + x) * 4;
        out.data[dstIdx]     = sheet.data[srcIdx];
        out.data[dstIdx + 1] = sheet.data[srcIdx + 1];
        out.data[dstIdx + 2] = sheet.data[srcIdx + 2];
        out.data[dstIdx + 3] = sheet.data[srcIdx + 3];
      }
    }
    await writeFile(join(OUT_DIR, `${s.name}.png`), PNG.sync.write(out));
    console.log(`✓ ${s.name}.png  (${s.w}×${s.h} from ${s.x},${s.y})`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
