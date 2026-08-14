import type { ToolManifest } from "../types";

export const countManifest = {
  id: "count",
  name: "Count.",
  tagline: "Every count, in one calm place.",
  description: "Simple counters with optional goals, resets, and history.",
  category: "Productivity",
  entitlement: "tool.count",
  icon: "hash",
  route: "/tools/count",
  free: true,
  featured: true,
  keywords: ["count", "counter", "tally", "goal", "daily", "people", "laps"],
  implemented: true,
} satisfies ToolManifest;
