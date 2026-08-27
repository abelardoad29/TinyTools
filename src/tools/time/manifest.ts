import type { ToolManifest } from "../types";
export const timeManifest = {
  id: "time",
  name: "Time.",
  tagline: "Timer, stopwatch, Pomodoro, and countdowns.",
  description:
    "A timer, stopwatch, Pomodoro cycle, and date countdowns, unified in one calm workspace.",
  category: "Productivity",
  entitlement: "tool.time",
  icon: "timer",
  route: "/tools/time",
  free: true,
  featured: true,
  keywords: ["time", "timer", "stopwatch", "pomodoro", "countdown", "focus", "laps"],
  implemented: true,
} satisfies ToolManifest;
