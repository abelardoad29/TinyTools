import type { ToolManifest } from "../types";
export const renameManifest = {
  id: "rename",
  name: "Rename.",
  tagline: "Rename files in one calm pass.",
  description: "Preview and apply consistent file names in batches.",
  category: "Files",
  entitlement: "tool.rename",
  icon: "file-pen",
  route: "/tools/rename",
  free: false,
  featured: true,
  keywords: ["rename", "files", "batch"],
  implemented: false,
} satisfies ToolManifest;
