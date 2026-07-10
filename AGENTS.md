# Agent guide — Frogger

## Read first

1. `prd.md` — current status and success criteria
2. `docs/plans/2026-04-30-frogger-design.md` — gameplay/layout/scoring
3. `tasks.md` — ordered next work
4. `key-learnings.md` — past pitfalls

## Commands

- Dev: `npm run dev`
- Typecheck + build: `npm run build`
- No test runner yet — verify by playing in the browser

## Architecture

- Fixed-timestep loop in `Game.ts` (`STEP = 1/60`)
- States: `ATTRACT | READY | PLAYING | DYING | LEVEL_COMPLETE | GAME_OVER` (ATTRACT/READY typed but not wired)
- Logical canvas: 448×480 (14×15 tiles of 32px). Scale via CSS integer nearest-neighbor
- Constants for scoring/timing live in `src/game/Constants.ts`; dimensions/palette in `src/types.ts`
- Sprites: individual PNGs in `public/sprites/cut/`, loaded by `Sprites.ts`

## Conventions

- Plain TypeScript classes/modules — no React/framework
- Prefer small focused files under `src/game/`
- Use `# Reason:` comments for non-obvious game-feel choices
- Do not add runtime dependencies without a clear need
- Do not commit secrets or regenerate/commit `frogger-clean/` dumps
- Never edit Backup/Archive folders (none present)

## Boundaries

- Keep collision/scoring logic in `Game.ts` (or extract deliberately)
- Audio stays synthesised unless product explicitly switches to files
- Match arcade feel: tile hops, no key-repeat, AABB road hits, center-x river ride test
