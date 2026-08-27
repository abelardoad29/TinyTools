import { awakeManifest } from "./awake/manifest";
import { calculatorsToolkitManifest } from "./calculators-toolkit/manifest";
import { countManifest } from "./count/manifest";
import { devToolkitManifest } from "./dev-toolkit/manifest";
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
  awakeManifest,
  renameManifest,
];
export const findTool = (id: string): ToolManifest | undefined =>
  toolRegistry.find((tool) => tool.id === id);
