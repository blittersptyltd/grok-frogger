# Tasks — Frogger

Ordered for continued development. Check off as done.

## Done (v1 core)

- [x] Vite + TS bootstrap, world background, HUD shells
- [x] Grid-stepped frog + input
- [x] Road lanes, cars, collision
- [x] River lanes, logs/turtles, ride + drown
- [x] Homes, scoring, timer, levels, game over
- [x] Cut arcade sprites wired in
- [x] Synthesised music + SFX + mute
- [x] Persisted hi-score (localStorage)
- [x] Level speed scaling (cap level 5)
- [x] Fix KeyD debug vs move-right conflict (debug → backtick)

## Next (polish — design slice 8)

1. [x] **ATTRACT screen** — title / “PRESS ENTER”; start in `ATTRACT` not `PLAYING`
2. [x] **READY interstitial** — brief “READY!” after start, death respawn, home seat, and level advance
3. [ ] **Load pixel font** — Press Start 2P (or similar) via `@font-face` / Google Fonts; HUD currently falls back to monospace
4. [x] **Home filled sprite polish** — front-facing `frog_in_home` from sheet `(45,197)`; arcade hedge/median textures; life icons use `frog_idle`
5. [ ] **Mute indicator** — small HUD cue when muted
6. [ ] **Tests** — unit tests for scoring, home seating, lane spawn rhythm (Vitest)

## Later / out of scope for v1

- [x] Diving turtles (`turtle_dive` / `turtle_submerged`) — unlock L2+
- [x] Fly bonus in homes — unlock L2+
- [x] Crocodiles on river — unlock L3+
- [x] Snakes on median — unlock L3+
- [x] Lady frog on logs — unlock L4+
- Touch / mobile controls
- Replace synth audio with authentic arcade samples

## Level unlocks

| Level | Features |
|---|---|
| 1 | Core gameplay + speed |
| 2 | ~22% diving turtles, fly bonus, lady frog |
| 3 | Full-body river crocs, croc head in homes, snakes |
| 5+ | Higher croc chance, faster everything |
