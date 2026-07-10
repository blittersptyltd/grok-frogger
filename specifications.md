# Specifications — Frogger

Companion to `docs/plans/2026-04-30-frogger-design.md`. Captures naming and module contracts used in code.

## Naming

| Concept | Name in code |
|---|---|
| Tile size | `TILE` (32) |
| Playfield rows | `ROW.*` in `World.ts` |
| Obstacle types | `ObstacleKind` in `Obstacle.ts` |
| Sprite ids | `SpriteName` in `Sprites.ts` |
| Game states | `GameState` in `types.ts` |

## Module responsibilities

| Module | Owns |
|---|---|
| `Game.ts` | Loop, state machine, scoring, collisions, level flow |
| `Frog.ts` | Hop tween, drift, death draw |
| `Lane.ts` | Spawn/despawn rhythm for one row |
| `Obstacle.ts` | Motion, bounds, draw per kind |
| `Homes.ts` | Alcove fill / draw |
| `World.ts` | Background + `ROW` / home geometry |
| `HUD.ts` | Score / lives / time bar draw |
| `Input.ts` | One-shot hop queue |
| `Audio.ts` | Synth SFX + music scheduler |
| `Sprites.ts` | Image load + draw helpers |

## Resolution

- Logical: `WIDTH = 448`, `HEIGHT = 480` (14 cols × 15 rows × 32)
- Display: integer CSS scale, `image-rendering: pixelated`
