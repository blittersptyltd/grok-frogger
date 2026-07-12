# Agent guide — Frogger

## Project status

The project is complete and deployed. Treat future requests as maintenance or optional enhancement. Preserve the shipped experience unless the user explicitly approves a redesign.

## Read first

1. `README.md` — public project overview
2. `prd.md` — completed product brief
3. `docs/ARCHITECTURE.md` — current architecture
4. `key-learnings.md` — implementation pitfalls
5. `docs/plans/` — historical plans, not current truth

## Commands

```bash
npm run dev
npm run test
npm run build
npm run check  # tests + build + dependency audit
```

## Architecture

- fixed 60 Hz simulation loop in `Game.ts`
- states: `ATTRACT | READY | PLAYING | DYING | LEVEL_COMPLETE | GAME_OVER`
- logical Canvas: 448×544
- 32 px content tiles centred within mobile-deepened rows
- row geometry: `World.ts`
- pure attract timing/demo route: `Attract.ts`
- synthesised and lifecycle-managed Web Audio: `Audio.ts`
- runtime sprites: `public/sprites/cut/*.png`

## Conventions

- no production runtime dependencies without a compelling reason
- keep Canvas simulation in logical coordinates
- source vertical positions from `rowY()` / `rowContentY()`
- update visual and collision geometry together
- keep attract and ready states silent
- preserve integer glyph-atlas source/destination geometry
- use `# Reason:` comments only for non-obvious game-feel/browser decisions
- visually verify sprite cuts and rotations
- run `npm run check` and a browser smoke test before deployment

## Boundaries

- do not replace recreated animation with captured footage
- do not commit intermediate sprite-sheet dumps
- do not assume Frogger-derived assets are openly licensed; see `NOTICE.md`
- keep historical plans as records, but update current docs when behaviour changes
- avoid broad rewrites of working gameplay during maintenance
