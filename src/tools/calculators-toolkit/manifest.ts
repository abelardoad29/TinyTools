import type { ToolManifest } from "../types";

export const calculatorsToolkitManifest = {
  id: "calculators-toolkit",
  name: "Calculators Toolkit.",
  tagline: "Units, storage, DPI, aspect ratio, dates, percentages, and more.",
  description:
    "Convert units, storage sizes, and coordinates, solve DPI and aspect ratio, diff dates, work percentages and rule of three, and switch between hh:mm and decimal hours — all local, all in one place.",
  category: "Calculators",
  entitlement: "tool.calculators-toolkit",
  icon: "calculator",
  route: "/tools/calculators-toolkit",
  free: true,
  featured: true,
  keywords: [
    "unit converter",
    "storage",
    "bytes",
    "dpi",
    "aspect ratio",
    "date difference",
    "percentage",
    "rule of three",
    "time decimal",
    "coordinates",
    "calculator",
  ],
  implemented: true,
} satisfies ToolManifest;
