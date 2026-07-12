# Specifications — Frogger

This file is retained as a compact contract reference. For detailed design, see `docs/ARCHITECTURE.md`.

## Core constants

| Concept | Contract |
|---|---|
| Content tile | `TILE = 32` |
| Logical Canvas | 448×544 |
| Columns | 14 |
| Row positions | `ROW`, `rowY()`, `rowHeight()`, `rowContentY()` in `World.ts` |
| States | `GameState` in `types.ts` |
| Attract timeline | `Attract.ts` |
| Difficulty/features | `Levels.ts`, `game/Constants.ts` |

## Runtime contracts

- simulation updates at a fixed 60 Hz
- one input produces at most one tile hop
- horizontal hops remain on one exact row baseline
- obstacle and player bounds share world row geometry
- Canvas sprite smoothing is disabled
- arcade glyph crops and destinations use integer geometry
- only `PLAYING` may start soundtrack music
- AudioContext suspends while the page is hidden/backgrounded
- CSS may fractionally down-scale the complete Canvas below 1×

## Quality contract

```bash
npm run check
```

This must pass:

1. Vitest regression suite
2. TypeScript and Vite production build
3. dependency audit at moderate severity or higher

Canvas visuals, touch controls, audio and PWA behaviour also require browser smoke testing.
