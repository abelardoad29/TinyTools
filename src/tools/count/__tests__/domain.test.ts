import { describe, expect, it } from "vitest";
import {
  decrement,
  increment,
  normalizeCounter,
  progressFor,
  reset,
  type UnifiedCounter,
} from "../domain";

describe("count domain", () => {
  it("increments and decrements across zero", () => {
    expect(increment(0)).toBe(1);
    expect(decrement(0)).toBe(-1);
  });
  it("resets any count", () => {
    expect(reset()).toBe(0);
  });

  it("rolls a daily counter into history", () => {
    const counter: UnifiedCounter = {
      id: "1",
      name: "Daily",
      value: 7,
      color: "neutral",
      goal: null,
      resetMode: "daily",
      date: "2026-08-12",
      history: [],
    };
    const next = normalizeCounter(counter, "2026-08-13");
    expect(next.value).toBe(0);
    expect(next.history[0]?.value).toBe(7);
  });

  it("calculates optional goal progress", () => {
    const counter: UnifiedCounter = {
      id: "1",
      name: "Goal",
      value: 25,
      color: "neutral",
      goal: 50,
      resetMode: "manual",
      date: "2026-08-13",
      history: [],
    };
    expect(progressFor(counter)).toBe(50);
    expect(progressFor({ ...counter, goal: null })).toBeNull();
  });
});
