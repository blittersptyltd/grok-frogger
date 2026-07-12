export type AttractSegment = 0 | 1 | 2 | 3 | 4 | 5;

export const ATTRACT_CYCLE_SECONDS = 93;

const SEGMENT_ENDS = [39, 48, 55, 63, 68] as const;

/** Maps elapsed attract-mode time to the active cabinet page/demo segment. */
export function attractSegmentAt(elapsedSeconds: number): AttractSegment {
  const cycle = ((elapsedSeconds % ATTRACT_CYCLE_SECONDS) + ATTRACT_CYCLE_SECONDS)
    % ATTRACT_CYCLE_SECONDS;
  const segment = SEGMENT_ENDS.findIndex((end) => cycle < end);
  return (segment === -1 ? 5 : segment) as AttractSegment;
}

export const ATTRACT_DEMO_MOVES = [
  "up", "up", "left", "up", "right", "up", "up", "left",
  "up", "right", "up", "up", "left", "right", "up", "up",
] as const;
