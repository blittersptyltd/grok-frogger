# Recreating the Frogger cabinet attract sequence

The attract sequence became the clearest example of why visual reconstruction needs both implementation skill and human judgement.

## The target

The original cabinet does not simply display the word “FROGGER”. It performs a piece of character animation:

1. Seven frogs arrive from the right.
2. Each joins a growing horizontal row.
3. The complete row makes several synchronised upward hops.
4. Horizontal spacing tightens as the frogs rise.
5. Frogs transform from left to right into the seven letters of `FROGGER`.
6. The cabinet rotates through point, ranking, instruction, start and demonstration pages.

That choreography is easy to misunderstand from a few still frames.

## The failed approximations

Early versions captured the broad idea but not the underlying action. They used incorrect frog counts, staircase-like formations and invented motion. A later shortcut embedded captured reference footage. It looked accurate because it was the reference—but it was not a reconstruction and therefore failed the intent of the task.

The correct response was not to polish the shortcut. It was to remove it.

## Reference-driven reconstruction

The sequence was analysed at short time intervals to identify:

- when each frog entered
- the seven resting X coordinates
- the common baseline
- the number and timing of group hops
- title position and glyph spacing
- the left-to-right transformation cadence
- transition times between cabinet pages

The final implementation uses:

- `frog_idle` and `frog_hop` sprite cuts
- discrete frame changes for the travelling frog
- a fixed baseline to avoid diagonal wobble
- four grouped rise steps
- interpolation from frog stations to letter centres
- an integer-cropped arcade glyph atlas
- a 93-second pure segment timeline

No video remains in the project.

## Font edge artefacts

The font atlas used 9×9 glyph cells. Some text appeared with a thin bar before its first character—for example `|CREDIT` or `|1 JUMP`.

The source glyphs were clean. The problem was fractional Canvas destination geometry. Rendering at 1.25× or 1.5× and centring at half-pixel positions allowed neighbouring atlas cells to bleed into the sample.

The renderer now:

- snaps scale to an integer
- snaps destination X/Y coordinates
- calculates centring from the same snapped scale
- uses exact integer source and destination cells

This is a useful general Canvas rule: nearest-neighbour mode does not rescue a sprite atlas from fractional crop geometry.

## Timing as testable data

Attract timing was extracted from `Game.ts` into `Attract.ts`. The segment mapper is now a pure function with regression tests for every boundary and cycle wrapping.

The scripted demo route is also exported as immutable data, making it easier to inspect and test independently from rendering.

## Product lesson

A visually plausible output can still be conceptually wrong. The reference video shortcut satisfied “show this animation” while violating “recreate this animation”. Human review caught the gap between surface output and product intent.

That is the central lesson of the sequence: AI can produce and revise implementation quickly, but fidelity requires someone to understand what the experience is actually doing.
