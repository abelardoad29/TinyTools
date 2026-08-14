import type { ToolManifest } from "../types";
export const awakeManifest = {
  id: "awake",
  name: "Awake.",
  tagline: "Keep your computer awake.",
  description: "Temporarily prevent sleep when you need it.",
  category: "System",
  entitlement: "tool.awake",
  icon: "coffee",
  route: "/tools/awake",
  free: true,
  keywords: ["awake", "sleep", "system"],
  implemented: false,
} satisfies ToolManifest;
