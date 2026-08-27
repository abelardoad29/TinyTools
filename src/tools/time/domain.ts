export type TimeMode = "timer" | "stopwatch" | "pomodoro" | "countdown";

export type CountdownRun = {
  totalMs: number;
  endsAt: number | null;
  remainingMs: number;
};

export const createRun = (totalMs: number): CountdownRun => ({
  totalMs,
  endsAt: null,
  remainingMs: totalMs,
});

export const startRun = (run: CountdownRun, now = Date.now()): CountdownRun =>
  run.endsAt !== null || run.remainingMs <= 0 ? run : { ...run, endsAt: now + run.remainingMs };

export const pauseRun = (run: CountdownRun, now = Date.now()): CountdownRun =>
  run.endsAt === null ? run : { ...run, remainingMs: Math.max(0, run.endsAt - now), endsAt: null };

export const remainingOf = (run: CountdownRun, now = Date.now()): number =>
  run.endsAt === null ? run.remainingMs : Math.max(0, run.endsAt - now);

export type StopwatchRun = { elapsedMs: number; startedAt: number | null; laps: number[] };

export const createStopwatch = (): StopwatchRun => ({ elapsedMs: 0, startedAt: null, laps: [] });

export const startStopwatch = (run: StopwatchRun, now = Date.now()): StopwatchRun =>
  run.startedAt !== null ? run : { ...run, startedAt: now };

export const pauseStopwatch = (run: StopwatchRun, now = Date.now()): StopwatchRun =>
  run.startedAt === null
    ? run
    : { ...run, elapsedMs: run.elapsedMs + (now - run.startedAt), startedAt: null };

export const elapsedFor = (run: StopwatchRun, now = Date.now()): number =>
  run.startedAt === null ? run.elapsedMs : run.elapsedMs + (now - run.startedAt);

export const lapStopwatch = (run: StopwatchRun, now = Date.now()): StopwatchRun => ({
  ...run,
  laps: [elapsedFor(run, now), ...run.laps],
});

export const resetStopwatch = (): StopwatchRun => createStopwatch();

export type PomodoroPhase = "focus" | "break";
export type PomodoroSettings = { focusMinutes: number; breakMinutes: number };
export type PomodoroState = {
  settings: PomodoroSettings;
  phase: PomodoroPhase;
  cyclesCompleted: number;
  run: CountdownRun;
};

export const createPomodoro = (settings: PomodoroSettings): PomodoroState => ({
  settings,
  phase: "focus",
  cyclesCompleted: 0,
  run: createRun(settings.focusMinutes * 60_000),
});

export const advancePomodoroPhase = (state: PomodoroState): PomodoroState => {
  const phase: PomodoroPhase = state.phase === "focus" ? "break" : "focus";
  const minutes = phase === "focus" ? state.settings.focusMinutes : state.settings.breakMinutes;
  return {
    ...state,
    phase,
    cyclesCompleted: state.phase === "focus" ? state.cyclesCompleted + 1 : state.cyclesCompleted,
    run: createRun(minutes * 60_000),
  };
};

export type CountdownTarget = { id: string; label: string; targetIso: string };

export const createCountdownTarget = (label: string, targetIso: string): CountdownTarget => ({
  id: crypto.randomUUID(),
  label: label.trim() || "Countdown",
  targetIso,
});

export const msUntilTarget = (target: CountdownTarget, now = Date.now()): number =>
  new Date(target.targetIso).getTime() - now;

export const formatCountdownParts = (ms: number): string => {
  const total = Math.max(0, ms);
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  const seconds = Math.floor((total % 60_000) / 1000);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

export const formatClock = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number): string => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};

export type SessionRecord = { id: string; label: string; durationMs: number; completedAt: string };

export const recordSession = (
  history: SessionRecord[],
  record: Omit<SessionRecord, "id">,
): SessionRecord[] => [{ id: crypto.randomUUID(), ...record }, ...history].slice(0, 50);

export type TimeState = {
  mode: TimeMode;
  timerMinutes: number;
  timer: CountdownRun;
  stopwatch: StopwatchRun;
  pomodoro: PomodoroState;
  countdowns: CountdownTarget[];
  history: SessionRecord[];
};

export const createTimeState = (): TimeState => ({
  mode: "timer",
  timerMinutes: 5,
  timer: createRun(5 * 60_000),
  stopwatch: createStopwatch(),
  pomodoro: createPomodoro({ focusMinutes: 25, breakMinutes: 5 }),
  countdowns: [],
  history: [],
});
