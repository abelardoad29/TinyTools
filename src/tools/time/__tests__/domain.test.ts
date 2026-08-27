import { describe, expect, it } from "vitest";
import {
  advancePomodoroPhase,
  createCountdownTarget,
  createPomodoro,
  createRun,
  createStopwatch,
  elapsedFor,
  formatClock,
  formatCountdownParts,
  lapStopwatch,
  msUntilTarget,
  pauseRun,
  pauseStopwatch,
  recordSession,
  remainingOf,
  startRun,
  startStopwatch,
} from "../domain";

describe("countdown run", () => {
  it("counts down from now while running", () => {
    const run = startRun(createRun(60_000), 0);
    expect(remainingOf(run, 0)).toBe(60_000);
    expect(remainingOf(run, 25_000)).toBe(35_000);
  });

  it("freezes remaining time when paused", () => {
    const run = startRun(createRun(60_000), 0);
    const paused = pauseRun(run, 25_000);
    expect(paused.endsAt).toBeNull();
    expect(remainingOf(paused, 999_999)).toBe(35_000);
  });

  it("never reports negative remaining time", () => {
    const run = startRun(createRun(1_000), 0);
    expect(remainingOf(run, 5_000)).toBe(0);
  });
});

describe("stopwatch", () => {
  it("accumulates elapsed time across start/pause cycles", () => {
    let run = startStopwatch(createStopwatch(), 0);
    run = pauseStopwatch(run, 10_000);
    expect(run.elapsedMs).toBe(10_000);
    run = startStopwatch(run, 20_000);
    expect(elapsedFor(run, 30_000)).toBe(20_000);
  });

  it("records laps as elapsed snapshots", () => {
    const run = startStopwatch(createStopwatch(), 0);
    const withLap = lapStopwatch(run, 12_000);
    expect(withLap.laps).toEqual([12_000]);
  });
});

describe("pomodoro", () => {
  it("alternates focus and break phases and counts cycles", () => {
    const state = createPomodoro({ focusMinutes: 25, breakMinutes: 5 });
    expect(state.phase).toBe("focus");
    const onBreak = advancePomodoroPhase(state);
    expect(onBreak.phase).toBe("break");
    expect(onBreak.cyclesCompleted).toBe(1);
    expect(onBreak.run.totalMs).toBe(5 * 60_000);
    const backToFocus = advancePomodoroPhase(onBreak);
    expect(backToFocus.phase).toBe("focus");
    expect(backToFocus.cyclesCompleted).toBe(1);
  });
});

describe("countdown targets", () => {
  it("computes time remaining until a target date", () => {
    const target = createCountdownTarget("Launch", new Date(60_000).toISOString());
    expect(msUntilTarget(target, 0)).toBe(60_000);
  });

  it("formats remaining time by magnitude", () => {
    expect(formatCountdownParts(90_000)).toBe("1m 30s");
    expect(formatCountdownParts(3 * 3_600_000 + 60_000)).toBe("3h 1m");
    expect(formatCountdownParts(2 * 86_400_000 + 3_600_000)).toBe("2d 1h");
  });
});

describe("session history", () => {
  it("keeps the most recent 50 records", () => {
    let history: ReturnType<typeof recordSession> = [];
    for (let i = 0; i < 55; i += 1) {
      history = recordSession(history, {
        label: `Session ${i}`,
        durationMs: 60_000,
        completedAt: new Date().toISOString(),
      });
    }
    expect(history).toHaveLength(50);
    expect(history[0]?.label).toBe("Session 54");
  });
});

describe("formatClock", () => {
  it("formats minutes and seconds under an hour", () => {
    expect(formatClock(65_000)).toBe("01:05");
  });

  it("includes hours once the duration reaches one", () => {
    expect(formatClock(3_665_000)).toBe("1:01:05");
  });
});
