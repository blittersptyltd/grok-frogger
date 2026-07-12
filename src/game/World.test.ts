import { describe, expect, it } from "vitest";
import { HEIGHT, HOME_DEPTH_EXTRA, PLAY_ROW_GAP, TILE } from "../types";
import { ROW, rowContentY, rowHeight, rowY } from "./World";

describe("world row geometry", () => {
  it("deepens the home band without stretching normal sprites", () => {
    expect(rowHeight(ROW.HOMES)).toBe(TILE + HOME_DEPTH_EXTRA);
    expect(rowContentY(ROW.HOMES)).toBe(rowY(ROW.HOMES) + HOME_DEPTH_EXTRA / 2);
  });

  it("adds consistent breathing room to gameplay rows", () => {
    expect(rowHeight(ROW.RIVER_1)).toBe(TILE + PLAY_ROW_GAP);
    expect(rowHeight(ROW.ROAD_3)).toBe(TILE + PLAY_ROW_GAP);
    expect(rowY(ROW.RIVER_2) - rowY(ROW.RIVER_1)).toBe(TILE + PLAY_ROW_GAP);
    expect(rowContentY(ROW.ROAD_3)).toBe(rowY(ROW.ROAD_3) + PLAY_ROW_GAP / 2);
  });

  it("places the bottom HUD exactly inside the canvas", () => {
    expect(rowY(ROW.HUD_BOTTOM) + rowHeight(ROW.HUD_BOTTOM)).toBe(HEIGHT);
  });
});
