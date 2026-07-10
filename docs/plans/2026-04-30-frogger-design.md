# Frogger Clone — Design Document

**Date:** 2026-04-30  
**Status:** Core implemented (2026-07-09). Polish (ATTRACT/READY) still open — see `prd.md` / `tasks.md`.

## Goal

Build a faithful, browser-based clone of the 1981 Konami arcade game *Frogger*. Visuals should match the original arcade as closely as possible (chunky pixels, classic palette, arcade sprites). Includes music and SFX (originally absent in the reference HappyHopper version).

## Scope (v1 — "Faithful Core")

- Single endless mode (waves get faster each level)
- 5 home alcoves at the top
- 3 lives, time-per-life, classic scoring
- Hand-authored arcade-faithful sprites
- Background music loop + core SFX
- Keyboard controls (arrow keys + WASD)

**Out of scope for v1** (possible extras later): lady frog bonus, fly bonus, alligator in homes, diving turtles, mobile touch controls.

> Note: persistent hi-score and synthesised Web Audio were added during implementation (design originally excluded hi-score and assumed audio files).

## Stack

- **Vite** + **TypeScript** (no UI framework)
- **Canvas 2D API** with `imageSmoothingEnabled = false`
- **HTMLAudioElement** for music + SFX
- No external runtime dependencies — deploys as static files

## Directory Layout

```
Frogger/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── sprites/frogger.png
│   └── audio/{music.ogg, sfx/*.wav}
├── src/
│   ├── main.ts
│   ├── game/
│   │   ├── Game.ts          # main loop + state machine
│   │   ├── Frog.ts
│   │   ├── Lane.ts
│   │   ├── Obstacle.ts
│   │   ├── HomeSlot.ts
│   │   ├── World.ts
│   │   ├── HUD.ts
│   │   ├── Input.ts
│   │   ├── Audio.ts
│   │   └── Sprites.ts
│   └── types.ts
└── docs/plans/
```

## Game Loop & State Machine

Fixed-timestep loop driven by `requestAnimationFrame`:

```
loop(now):
  accumulator += (now - lastFrame)
  while accumulator >= STEP (1/60s):
    update(STEP); accumulator -= STEP
  render()
  raf(loop)
```

States: `ATTRACT` → `READY` → `PLAYING` → `DYING` → (`READY` | `LEVEL_COMPLETE` | `GAME_OVER`).

Time per life: 30s. Time bar drains; warning SFX at ~25% remaining; time-out = death.

Difficulty: each level +~10% obstacle speed; capped at level 5.

Input: tile-stepped — one hop per keypress (no key-repeat).

## World Layout

- Logical resolution: **448×512 px** (14 cols × 13 rows of 32px tiles + HUD)
- Render at 2x or 3x scale, nearest-neighbor

| Row | Contents |
|---|---|
| 0 | HUD top: 1-UP / score / HI-SCORE |
| 1 | Home alcoves (5 slots, hedges between) |
| 2 | River: medium logs (→) |
| 3 | River: 3-turtles (←) |
| 4 | River: long logs (→) |
| 5 | River: short logs (→) |
| 6 | River: 2-turtles (←) |
| 7 | Median (purple safe zone) |
| 8 | Road: trucks (←) |
| 9 | Road: race cars (→) |
| 10 | Road: sedans (←) |
| 11 | Road: purple cars (→) |
| 12 | Road: yellow taxis (←) |
| 13 | Start strip (purple) |
| 14 | HUD bottom: lives + TIME bar |

## Movement & Collision

- **Frog:** grid-stepped 32px hops, ~150ms tween animation, can't be interrupted mid-hop
- **Obstacles:** continuous px/sec movement, spawn off-screen, despawn off-screen, randomized cadence
- **Road collision:** AABB overlap with car = death
- **River rules:** must overlap log/turtle bbox to "ride"; ride = inherit platform velocity; not riding on water = drown; carried off-screen = death
- **Home slots:** land in row 1; must align with empty alcove; filled or hedge = death

## Scoring

| Action | Points |
|---|---|
| Forward step | 10 |
| Reach home | 50 |
| Time bonus | 10 × seconds remaining |
| All 5 homes (level clear) | 1000 |
| Extra life threshold | 20,000 (one-time) |

Lives: 3 to start. Game over at 0.

## Sprites (hand-authored)

Single PNG sprite sheet, 32×32 tiles, arcade palette (deep navy water, magenta median, lime grass, etc.).

Tiles: frog idle/hop in 4 directions, frog squashed, frog drowned, log (3 lengths), turtle (3 dive frames), 4 car variants, truck, bulldozer, hedge, frog-in-home.

## Audio

- 1 looping chiptune background track (CC0/CC-BY, credited)
- SFX: hop, splat, plunk, home, extra-life, time-warning, level-complete
- Mute toggle (M key)

## Build Order (Slices)

1. Vite + TS bootstrap, render empty playfield with row backgrounds + HUD shells
2. Placeholder frog with grid-stepped input
3. Road lanes + cars + collision
4. River lanes + logs/turtles + ride mechanics
5. Home slots, scoring, timer, level flow → fully playable end-to-end
6. Replace placeholders with hand-authored arcade-faithful sprite sheet
7. Background music + SFX
8. Polish: ATTRACT screen, READY!, GAME OVER, level transitions, difficulty scaling

Each slice is playable so we can test, refine, and steer.
