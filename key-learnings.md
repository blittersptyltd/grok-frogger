# Key learnings

## Input key conflicts (2026-07-09)

`KeyD` was bound both as move-right (`Input.ts`) and debug toggle (`Game.ts`). Pressing D flipped the debug overlay while also hopping right. **Fix:** debug uses ``Backquote`` (`` ` ``). Never reuse WASD/arrow codes for meta actions.

## Duplicate constants (2026-07-09)

`src/Constants.ts` duplicated `types.ts` + `game/Constants.ts` and was unused. Prefer a single source: dimensions/palette/types in `types.ts`, tunables in `game/Constants.ts`.

## Attract overlay covered the median (2026-07-10)

Title banner was centered on `ROW.MEDIAN` with a dark `fillRect`, so the purple centre bank looked missing until PLAYING. Move banners to `ROW.ROAD_3` (asphalt).

## Double frog on last home (2026-07-10)

On level clear, `frog_in_home` is drawn in the alcove while the player frog stayed on `ROW.HOMES` for the whole `LEVEL_COMPLETE` banner. Reset + skip drawing the player (and carried lady) during `LEVEL_COMPLETE`.


## Sprite pipeline

Runtime assets are `public/sprites/cut/*.png` only. Large intermediate dumps (`frogger-clean/`, sheet variants) are tooling output — keep them gitignored.

## Design vs implementation drift

Design listed persistent hi-score as out of scope; it is implemented via `localStorage` (`HIGH_SCORE_KEY`). Design listed file-based audio; implementation uses Web Audio synthesis. Prefer code + `prd.md` over the original plan when they diverge.

## Sprite facing & log seams (2026-07-09)

Vehicle/turtle facing is per-sprite, not universal. `car_white` (tractor) and `car_green` (racer) face right in the cut PNGs; yellow taxi/truck face left. Turtle flip was inverted vs travel direction.

Log cut PNGs (`log_l`/`log_m`/`log_r`) are 16×22 but the wood body is only rows 2–11; bottom rows have stray opaque pixels that look like crocodile tops when the full frame is stretched. Crop to the body (`LOG_SRC_Y`/`LOG_SRC_H`) and draw at 2×. Also overlap segments horizontally — transparent side padding otherwise shows water seams.

## frog_in_home was a fly (2026-07-09)

`scripts/cut-sprites.mjs` originally cropped `frog_in_home` from sheet cell `(79,198)` — that cell is the bonus fly. Correct front-facing home frog is at `(45,197)` (16×15). Fly kept as `bonus_fly.png`. Always visually verify a new cut before wiring it.

## Arcade background textures (2026-07-09)

Flat solid grass/median looked too simplified vs arcade. Hedge uses diagonal hatch + orange speckles (`fillHedgeTexture`); median uses dense red/blue pebble dots sampled from sheet colors (`#8500D9` / `#E00000` / `#0000D9`). Life icons use scaled `frog_idle` instead of placeholder squares.

## Arcade-faithful audio (2026-07-09)

Generic major-key loop replaced with transcribed Frogger themes from computerarcheology.com: intro = Inu no omawari-san, main loop = Araiguma Rascal. Still Web Audio synthesis (no ROM samples). SFX retuned toward AY-style short square/noise one-shots. Music stays quieter than SFX so hops cut through.

## Level hazards & bonuses (2026-07-09)

Unlock schedule in `Levels.ts`: L2 diving turtles + fly, L3 crocs + snakes, L4 lady frog. Diving turtles drown when fully submerged (`isRideableNow`). Croc body is rideable; mouth (`lethalBounds`) kills. Snake patrols median. Fly relocates among empty homes; lady rides a random log.

## Mobile layout + touch (2026-07-10)

Integer canvas CSS scale (`Math.floor`) breaks on phones once a D-pad reserves vertical space — `floor(0.87)=0` then `max(1,…)` overflows the stage. Fit to `#stage` and allow fractional scale when `raw < 1`. Hybrid controls: D-pad one-shot hops + swipe (≥28px) + short tap/START as confirm. Clear hops (not confirm) on ATTRACT so leftover swipes don’t fire after READY. `touch-action: none` + non-passive `touchmove` preventDefault stops iOS rubber-banding from eating gestures.

