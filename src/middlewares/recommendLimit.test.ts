import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRecommendLimit } from "./recommendLimit";

describe("checkRecommendLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows first 3 requests", () => {
    const userId = 99999;
    expect(checkRecommendLimit(userId)).toBe(true);
    expect(checkRecommendLimit(userId)).toBe(true);
    expect(checkRecommendLimit(userId)).toBe(true);
  });

  it("blocks 4th request within 1 minute", () => {
    const userId = 99998;
    checkRecommendLimit(userId);
    checkRecommendLimit(userId);
    checkRecommendLimit(userId);
    const result = checkRecommendLimit(userId);
    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(60);
  });

  it("allows again after window expires", () => {
    const userId = 99997;
    checkRecommendLimit(userId);
    checkRecommendLimit(userId);
    checkRecommendLimit(userId);
    expect(checkRecommendLimit(userId)).toBeTypeOf("number");

    // Advance past the 1-minute window
    vi.advanceTimersByTime(61_000);

    expect(checkRecommendLimit(userId)).toBe(true);
  });

  it("tracks users independently", () => {
    const userA = 11111;
    const userB = 22222;
    checkRecommendLimit(userA);
    checkRecommendLimit(userA);
    checkRecommendLimit(userA);
    expect(checkRecommendLimit(userA)).toBeTypeOf("number");
    expect(checkRecommendLimit(userB)).toBe(true);
  });
});
