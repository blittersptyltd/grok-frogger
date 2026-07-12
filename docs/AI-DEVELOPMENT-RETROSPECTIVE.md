# AI development retrospective

## Executive summary

This project tested whether a human product owner and an AI coding agent could take a recognisable arcade experience from brief to polished browser product.

The finished application is a mobile-first TypeScript/Canvas reconstruction with complete gameplay, progressive hazards, synthesised audio, cabinet-style attract mode, touch controls, PWA installation, automated tests and static deployment.

The experiment succeeded, but not because the AI produced a perfect implementation in one pass. It succeeded because rapid implementation was paired with persistent human review.

## How the work was divided

### Human contribution

- selected the product and fidelity target
- supplied visual references and mobile screenshots
- identified when movement, spacing, fonts or audio felt wrong
- rejected implementations that met the letter but not the intent
- prioritised mobile readability and product polish
- declared the point at which the experiment was complete

### AI-agent contribution

- translated requirements into architecture and code
- implemented the game loop, state machine and gameplay systems
- processed sprite assets and investigated alpha/crop geometry
- built responsive touch and PWA behaviour
- implemented and debugged Web Audio
- used browser instrumentation and scripts for verification
- managed builds, Git history, deployment and documentation

## Development arc

### 1. Faithful core

The project began with a lean Vite/TypeScript/Canvas stack. Core slices added the world, frog movement, road collision, river riding, home slots, scoring, lives, timer and level progression.

The fixed-timestep loop and tile movement established a stable foundation. Features could be added incrementally while the game remained playable.

### 2. Visual and gameplay expansion

Runtime sprite cuts replaced placeholders. Later levels introduced diving turtles, flies, crocodiles, snakes and lady-frog bonuses. Per-sprite facing and source-crop issues required visual inspection; generic assumptions about orientation produced incorrect vehicles and turtles.

The background also evolved from flat colours to textured hedges, median pebbles and arcade-style life icons.

### 3. Mobile product work

Touch support was not simply four buttons. It required swipe thresholds, one-shot input, prevention of browser rubber-banding, confirmation handling and responsive control placement.

Integer-only Canvas scaling failed once mobile controls consumed screen height. The fit strategy was revised to allow fractional CSS down-scaling while retaining a fixed logical Canvas.

The board itself later became deeper. Shared row geometry added home and lane breathing room while keeping 32-pixel sprites and collision boxes centred and unstretched.

### 4. PWA and browser constraints

A boot chooser and install guidance were introduced because automatic fullscreen is prohibited without a user gesture. iPhone and in-app browsers cannot reliably hide their chrome, so the product explains the real path: open in Safari, add to the home screen and launch in standalone mode.

This was a recurring product principle: do not disguise browser limitations as user error.

### 5. Attract-mode reconstruction

The cabinet attract sequence went through the most iteration.

Approximations initially used the wrong number of frogs and incorrect formations. Captured reference footage was briefly embedded as a shortcut. Although visually accurate, it was rejected because the task was to recreate the sequence.

The final implementation traced the reference choreography and rebuilt it with Canvas sprites:

- seven travelling/assembled frogs
- one horizontal baseline
- synchronised rise steps
- tightening horizontal spacing
- left-to-right letter transformation
- cabinet score, point, ranking, instruction and start pages

The captured video asset and all playback code were removed.

### 6. Font and audio debugging

Arcade-font fragments were traced to fractional atlas sampling rather than dirty source graphics. Integer source/destination geometry removed adjacent-cell bleed.

Audio exposed asynchronous lifecycle issues. Multiple start paths could race and create overlapping tracks. Attract was made silent, `PLAYING` became the sole music owner, pending starts were guarded and scheduled oscillators were tracked.

A final mobile bug allowed sound to continue after backgrounding. The AudioContext now suspends on visibility hide, pagehide and page freeze.

### 7. Closeout

The final pass:

- extracted attract timing into pure testable data
- added Vitest regression coverage
- upgraded Vite to remove development-server advisories
- established a single `npm run check` quality gate
- replaced stale work-in-progress docs
- documented architecture, mobile design and the attract reconstruction
- created a website showcase, long-form tutorial and publishing kit

## What AI did particularly well

### Rapid technical translation

Product feedback such as “make the play area deeper without stretching sprites” became shared row geometry used by rendering, movement and collision.

### Cross-system tracing

Changes often touched multiple modules. The agent could locate every place where row positions, audio starts or sprite coordinates were used and update them consistently.

### Instrumented debugging

Several fixes were verified with measurements rather than confidence:

- alpha-bound analysis for sprite padding
- Web Audio oscillator-start instrumentation
- Canvas pixel-centroid sampling during horizontal hops
- browser console inspection
- deployment-run verification

### Maintaining momentum

Small product corrections could be implemented, built, tested and deployed quickly, keeping feedback loops short.

## Where AI needed strong steering

### Visual intent

The agent could produce something plausible without reproducing the actual reference behaviour. Human observation identified the mismatch.

### Shortcut detection

Embedding footage met a surface requirement but violated the experiment. The agent needed the product owner to reject it explicitly.

### “Feels wrong” feedback

Spacing, sprite baselines, board depth and timing were often easier for a person to notice than to specify in advance.

### Completion judgement

Software can always be extended. The human decided that the experiment had answered its question and that further work would be optional enhancement rather than missing scope.

## Process lessons

1. **Use a product brief, not a mega-prompt.** Define the experience, constraints and non-goals.
2. **Build in playable slices.** Every stage should be inspectable.
3. **Keep reference material close.** Visual tasks need direct comparison.
4. **Ask for execution evidence.** Builds, browser output and deployment status matter more than prose.
5. **Convert visual bugs into measurements.** Pixel bounds and timing data make debugging repeatable.
6. **Reject convincing wrong answers.** Surface fidelity can hide conceptual failure.
7. **Refactor during iteration.** Shared geometry and lifecycle ownership prevented later fixes from becoming patches on patches.
8. **Let the human own taste.** Product judgement is not an implementation detail.

## Final assessment

An AI coding agent can act as a capable builder and technical translation layer for a non-traditional developer. It can turn product direction into a working artefact, investigate complex browser issues and maintain a high iteration speed.

It does not eliminate the need for product ownership. The strongest result came from collaboration: human intent and visual judgement combined with agent execution and verification.

That is a more useful conclusion than either extreme—“AI built everything” or “AI is only autocomplete”. In this project, it functioned as an unusually fast implementation partner whose work improved dramatically when the human kept reviewing the actual experience.
