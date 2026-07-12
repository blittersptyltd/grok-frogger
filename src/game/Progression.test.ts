import { describe, expect, it } from "vitest";
import { levelSpeedMultiplier } from "./Constants";
import { featuresForLevel } from "./Levels";

describe("level progression", () => {
  it("keeps level one readable", () => {
    const level = featuresForLevel(1);
    expect(level.divingTurtles).toBe(false);
    expect(level.crocodiles).toBe(false);
    expect(level.snakes).toBe(false);
    expect(level.flyBonus).toBe(false);
    expect(level.ladyFrog).toBe(false);
  });

  it("unlocks bonuses before advanced hazards", () => {
    const level2 = featuresForLevel(2);
    const level3 = featuresForLevel(3);
    expect(level2.divingTurtles && level2.flyBonus && level2.ladyFrog).toBe(true);
    expect(level2.crocodiles || level2.snakes).toBe(false);
    expect(level3.crocodiles && level3.snakes).toBe(true);
  });

  it("caps speed scaling after level seven", () => {
    expect(levelSpeedMultiplier(1)).toBe(1);
    expect(levelSpeedMultiplier(7)).toBeCloseTo(1.72);
    expect(levelSpeedMultiplier(20)).toBe(levelSpeedMultiplier(7));
  });
});
