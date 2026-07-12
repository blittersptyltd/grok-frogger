import { describe, expect, it } from "vitest";
import {
  ATTRACT_CYCLE_SECONDS,
  ATTRACT_DEMO_MOVES,
  attractSegmentAt,
} from "./Attract";

describe("attract cycle", () => {
  it.each([
    [0, 0], [38.999, 0],
    [39, 1], [47.999, 1],
    [48, 2], [54.999, 2],
    [55, 3], [62.999, 3],
    [63, 4], [67.999, 4],
    [68, 5], [92.999, 5],
  ] as const)("maps %s seconds to segment %s", (elapsed, segment) => {
    expect(attractSegmentAt(elapsed)).toBe(segment);
  });

  it("wraps cleanly after one cabinet cycle", () => {
    expect(attractSegmentAt(ATTRACT_CYCLE_SECONDS)).toBe(0);
    expect(attractSegmentAt(ATTRACT_CYCLE_SECONDS + 68)).toBe(5);
  });

  it("keeps the demo route non-empty and direction-safe", () => {
    expect(ATTRACT_DEMO_MOVES.length).toBeGreaterThan(0);
    expect(ATTRACT_DEMO_MOVES.every((move) =>
      ["up", "down", "left", "right"].includes(move)
    )).toBe(true);
  });
});
