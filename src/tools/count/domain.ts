export const increment = (value: number): number => value + 1;
export const decrement = (value: number): number => value - 1;
export const reset = (): number => 0;

export type ResetMode = "manual" | "daily" | "session";
export type UnifiedCounter = {
  id: string;
  name: string;
  value: number;
  color: string;
  goal: number | null;
  resetMode: ResetMode;
  date: string;
  history: { label: string; value: number; timestamp: string }[];
};

export const dateKey = (date = new Date()): string => date.toLocaleDateString("en-CA");
export const createCounter = (name: string, options?: Partial<UnifiedCounter>): UnifiedCounter => ({
  id: crypto.randomUUID(),
  name: name.trim() || "Untitled",
  value: 0,
  color: "neutral",
  goal: null,
  resetMode: "manual",
  date: dateKey(),
  history: [],
  ...options,
});
export const normalizeCounter = (counter: UnifiedCounter, today = dateKey()): UnifiedCounter =>
  counter.resetMode === "daily" && counter.date !== today
    ? {
        ...counter,
        value: 0,
        date: today,
        history: [
          { label: counter.date, value: counter.value, timestamp: new Date().toISOString() },
          ...counter.history,
        ].slice(0, 50),
      }
    : counter;
export const progressFor = (counter: UnifiedCounter): number | null =>
  counter.goal === null ? null : Math.min(100, Math.max(0, (counter.value / counter.goal) * 100));
