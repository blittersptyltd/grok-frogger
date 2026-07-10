// Reads sheet-v2.png (which has a black background) and writes a copy with all
// pure-black pixels converted to transparent.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public/sprites/sheet-v2.png");
const DST = join(ROOT, "public/sprites/sheet-v2-transparent.png");

const buf = await readFile(SRC);
const png = PNG.sync.read(buf);
// Sheet-v2 uses TWO bg colors: pure black between rows + gray (64,64,64)
// between cells. Key out both so each sprite is cleanly isolated.
for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
  if ((r === 0 && g === 0 && b === 0) || (r === 64 && g === 64 && b === 64)) {
    png.data[i + 3] = 0;
  }
}
await writeFile(DST, PNG.sync.write(png));
console.log(`Wrote ${DST}`);
