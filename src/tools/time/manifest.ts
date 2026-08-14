import type { ToolManifest } from "../types";
export const timeManifest = {
  id: "time",
  name: "Time.",
  tagline: "A timer without the noise.",
  description: "Keep a simple timer close at hand.",
  category: "Productivity",
  entitlement: "tool.time",
  icon: "timer",
  route: "/tools/time",
  free: false,
  keywords: ["time", "timer", "focus"],
  implemented: false,
} satisfies ToolManifest;
