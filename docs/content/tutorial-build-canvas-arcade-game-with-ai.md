---
title: "How to build a mobile Canvas arcade game with an AI coding agent"
description: "A practical architecture and workflow tutorial for creating an original TypeScript arcade game with fixed-step simulation, sprites, audio, touch controls, tests and PWA deployment."
status: draft
content_type: tutorial
---

# How to build a mobile Canvas arcade game with an AI coding agent

This tutorial explains how to build an original lane-crossing arcade game using TypeScript, Canvas 2D and an AI coding agent. It draws on lessons from our Frogger reconstruction, but the architecture is deliberately generic: use your own title, artwork, audio and game identity.

The goal is not to ask an agent for “a complete game” and hope for magic. The goal is to create a development loop where product intent, architecture, implementation and verification stay aligned.

## What we are building

Our example game has:

- a player who moves one tile per input
- continuously moving traffic lanes
- water lanes with rideable platforms
- destination slots at the top
- lives, score, timer and increasing difficulty
- keyboard, swipe and D-pad controls
- synthesised sound
- an attract screen and gameplay state machine
- mobile/PWA deployment

## 1. Start with a product brief

Before generating code, write the rules in plain language.

```markdown
Goal: a mobile-first pixel arcade game playable in a browser.

Core loop:
- Move one tile per input.
- Avoid road hazards.
- Ride platforms across water.
- Reach five destination slots before losing all lives.

Experience:
- Crisp pixel graphics.
- Fast restart after failure.
- Keyboard and touch input.
- Silent attract screen; music during gameplay.
- Installable from a mobile browser.
```

Add explicit non-goals. For an MVP, that might exclude online accounts, multiplayer, procedural levels and a backend.

This is the first important AI practice: give the agent a product boundary, not just a coding instruction.

## 2. Choose the leanest architecture

A framework is unnecessary for a single-canvas game. Use:

- Vite for development and production bundling
- TypeScript for explicit game-state contracts
- Canvas 2D for rendering
- Web Audio for generated sounds
- DOM elements for touch controls and install prompts
- Vitest for pure logic

Create the project:

```bash
npm create vite@latest lane-hopper -- --template vanilla-ts
cd lane-hopper
npm install
npm install --save-dev vitest
```

Suggested structure:

```text
src/
  main.ts
  types.ts
  game/
    Game.ts
    Player.ts
    Lane.ts
    Obstacle.ts
    World.ts
    Input.ts
    Audio.ts
    HUD.ts
    Constants.ts
```

Ask the coding agent to preserve those responsibilities. Without boundaries, game projects quickly collapse into one file containing rendering, physics, UI and audio.

## 3. Establish logical coordinates

Choose a fixed internal resolution. For example:

```ts
export const TILE = 32;
export const COLS = 14;
export const WIDTH = TILE * COLS;
export const HEIGHT = 544;
```

The Canvas always uses these logical dimensions. CSS scales the complete Canvas to the available screen.

```ts
canvas.width = WIDTH;
canvas.height = HEIGHT;
ctx.imageSmoothingEnabled = false;
```

Do not make game rules depend on CSS pixels. Pointer input can be converted into Canvas coordinates when necessary, but simulation and collision should remain in one logical system.

### Mobile row depth

Pixel sprites may need more space on a phone. Do not stretch the whole Canvas vertically. Separate row position from content position:

```ts
export function rowY(row: number): number {
  return row * TILE + extraSpacingBefore(row);
}

export function rowHeight(row: number): number {
  return TILE + extraDepthFor(row);
}

export function rowContentY(row: number): number {
  return rowY(row) + (rowHeight(row) - TILE) / 2;
}
```

Render sprites and place collision boxes at `rowContentY()`. Draw backgrounds with `rowHeight()`. The board becomes easier to read while content remains proportionally correct.

## 4. Use a fixed-timestep loop

Rendering frame rates vary. Game simulation should not.

```ts
const STEP = 1 / 60;
let last = performance.now();
let accumulator = 0;

function loop(now: number): void {
  accumulator += (now - last) / 1000;
  last = now;

  while (accumulator >= STEP) {
    game.update(STEP);
    accumulator -= STEP;
  }

  game.render();
  requestAnimationFrame(loop);
}
```

Moving objects then use pixels per second:

```ts
obstacle.x += obstacle.speed * dt * obstacle.direction;
```

This makes behaviour far easier to tune and test than frame-dependent movement.

## 5. Model gameplay as states

Do not scatter menu booleans through the update loop.

```ts
type GameState =
  | "ATTRACT"
  | "READY"
  | "PLAYING"
  | "DYING"
  | "LEVEL_COMPLETE"
  | "GAME_OVER";
```

Each state owns its update rules:

- `ATTRACT`: rotate informational screens and accept start
- `READY`: short countdown, no movement
- `PLAYING`: movement, collisions, scoring and timer
- `DYING`: play death animation, then respawn or end
- `LEVEL_COMPLETE`: show result, then increase difficulty
- `GAME_OVER`: stop music and accept continue

Make transitions explicit methods such as `enterReady()` and `enterAttract()`. This gives the agent obvious places to add lifecycle behaviour and prevents bugs such as music surviving into menus.

## 6. Implement tile movement carefully

The player moves discretely while the animation interpolates smoothly.

```ts
tryHop(direction: Direction): void {
  if (this.isHopping()) return;

  this.hopFrom = { row: this.row, col: this.col };
  this.applyDestination(direction);
  this.hopTime = 0;
}
```

Commit gameplay to the destination tile immediately, but render between start and end:

```ts
const t = Math.min(1, hopTime / HOP_DURATION);
const x = fromX + (toX - fromX) * t;
const y = horizontalHop ? toY : fromY + (toY - fromY) * t;
```

Pinning horizontal hops to a single `toY` avoids accidental vertical wobble after row geometry changes.

### Sprite optical alignment

Two same-sized PNG files can have different transparent padding. Measure their alpha bounds before adding arbitrary offsets. Rotation changes which source-axis difference becomes visible on screen, so a correction valid for an upward sprite may be wrong for a left-facing sprite.

This is a perfect job for an agent with a small image-analysis script—but verify the result visually.

## 7. Build lanes from data

Keep lane definitions declarative:

```ts
const ROAD_LANES = [
  { row: 9, direction: -1, speed: 35, kind: "truck", spacing: TILE * 9 },
  { row: 10, direction: 1, speed: 70, kind: "car", spacing: TILE * 8 },
];
```

A `Lane` owns obstacle creation and movement. An `Obstacle` owns bounds and rendering.

For road collision, AABB is sufficient:

```ts
function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}
```

For water:

1. Find a rideable object overlapping the player centre.
2. Apply that platform’s horizontal velocity to player drift.
3. If no rideable platform exists, trigger drowning.
4. Treat temporary submerged states as non-rideable.

Keep lethal sub-bounds separate. A crocodile body can be rideable while its mouth is dangerous.

## 8. Create a sprite pipeline

Store runtime sprites as small, individually named PNG files. Keep extraction sheets and intermediate dumps out of production.

```text
public/sprites/cut/
  player_idle.png
  player_hop.png
  car_red.png
  log_left.png
  log_middle.png
  log_right.png
```

Visually inspect every cut. In our experiment, one incorrectly selected sheet cell labelled as a home frog was actually a fly. The type system cannot catch the wrong picture.

For tiled objects such as logs, inspect transparent padding and opaque artefacts. Crop to the useful source rectangle and overlap repeated sections if transparent borders create seams.

## 9. Render pixel text without atlas bleed

A sprite font gives a more authentic result than a system font, but crop geometry must be exact.

```ts
const scale = Math.max(1, Math.round(requestedScale));
const drawX = Math.round(x);
const drawY = Math.round(y);
```

Use integer source cells and integer destination rectangles. Fractional 1.25× or 1.5× atlas rendering can sample an adjacent glyph, producing thin bars or coloured fragments even when smoothing is disabled.

## 10. Add Web Audio with lifecycle ownership

A simple chiptune can be generated with oscillators and gain envelopes. The difficult part is not generating a note; it is managing browser policy and state.

Rules worth enforcing:

- unlock AudioContext from a user gesture
- allow exactly one game state to start music
- guard asynchronous start requests
- track scheduled oscillators
- stop scheduled notes, not only future scheduler ticks
- suspend the context when the page hides or freezes

```ts
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    void audioContext.suspend();
  } else {
    void audioContext.resume();
  }
});
```

Also listen for `pagehide` on mobile. Otherwise music may continue after the browser or installed PWA is backgrounded.

## 11. Treat touch controls as first-class input

Use real buttons for the D-pad so accessibility semantics and pointer behaviour are available. Feed buttons, keyboard and swipe into one input abstraction.

For swipe:

- apply `touch-action: none` to the playfield
- use a movement threshold to avoid accidental taps
- call `preventDefault()` from a non-passive move listener where necessary
- emit only one hop when the gesture resolves

Do not allow stale movement events to survive state transitions.

## 12. Design PWA/fullscreen UX honestly

Browsers block automatic fullscreen. iPhone Safari and in-app browsers may not support hiding browser chrome at all.

Offer choices after a user gesture:

- play in the browser
- enter fullscreen where supported
- install/add to home screen where appropriate

Detect standalone mode and avoid showing installation instructions after installation.

A web manifest and service worker are enough for a static game. Avoid over-engineering offline infrastructure.

## 13. Use AI as an implementation partner

A productive agent brief should include:

- the user-facing outcome
- architecture boundaries
- files that own the behaviour
- reference material
- acceptance criteria
- commands that prove completion

Example:

```text
Increase mobile row depth without stretching sprites.
Use shared row geometry for rendering and collision.
Keep horizontal dimensions unchanged.
Run unit tests, production build and a browser visual check.
```

That is much better than “make it look better on mobile”.

### Require real verification

Ask the agent to report:

- actual test output
- actual production build output
- browser console errors
- visual screenshots or sampled Canvas measurements
- deployment run result

When a bug is visual, convert it into data where possible. We measured sprite alpha bounds, instrumented oscillator starts and sampled the rendered frog centroid across animation frames.

## 14. Test pure rules first

Canvas screenshots are useful, but pure functions give cheap regression protection.

Test:

- state timeline boundaries
- world row geometry
- score calculations
- level unlocks
- speed caps
- destination-slot mapping

```ts
it("places the bottom HUD inside the canvas", () => {
  expect(rowY(HUD_ROW) + rowHeight(HUD_ROW)).toBe(HEIGHT);
});
```

Keep browser smoke tests for the things unit tests cannot prove: touch feel, visual fidelity, audio policy and installation flows.

## 15. Deploy as static files

Set the correct Vite base path for your host and use GitHub Actions to run the quality gate before deployment.

```bash
npm run check
npm run build
```

A static Canvas game is an excellent deployment target: no server state, database, secrets or runtime infrastructure.

## Final lesson

The best AI-assisted workflow is not one giant prompt. It is a sequence of small, testable product decisions.

Build a playable slice. Inspect it. Describe the discrepancy precisely. Let the agent trace the implementation. Verify the fix with both tools and human judgement. Clean the architecture as the product changes.

The agent supplies speed and technical translation. The human supplies intent and taste. You need both if the goal is not merely functioning software, but a coherent experience.
