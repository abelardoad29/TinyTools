import { awakeManifest } from "./awake/manifest";
import { calculatorsToolkitManifest } from "./calculators-toolkit/manifest";
import { countManifest } from "./count/manifest";
import { devToolkitManifest } from "./dev-toolkit/manifest";
import { imageToolkitManifest } from "./image-toolkit/manifest";
import { pdfToolkitManifest } from "./pdf-toolkit/manifest";
import { qrToolkitManifest } from "./qr-toolkit/manifest";
import { renameManifest } from "./rename/manifest";
import { textToolkitManifest } from "./text-toolkit/manifest";
import { timeManifest } from "./time/manifest";
import type { ToolManifest } from "./types";

export const toolRegistry: readonly ToolManifest[] = [
  countManifest,
  timeManifest,
  devToolkitManifest,
  textToolkitManifest,
  calculatorsToolkitManifest,
  qrToolkitManifest,
  imageToolkitManifest,
  pdfToolkitManifest,
  awakeManifest,
  renameManifest,
];
export const findTool = (id: string): ToolManifest | undefined =>
  toolRegistry.find((tool) => tool.id === id);

/**
 * What the public catalog shows. Manifests exist for tools that are still only
 * scaffolding (Awake., Rename.); listing those would send visitors to a dead end,
 * so they stay out of the sidebar, hub and command palette until they ship.
 */
export const visibleTools: readonly ToolManifest[] = toolRegistry.filter(
  (tool) => tool.implemented,
);
