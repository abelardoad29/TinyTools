import { awakeManifest } from "./awake/manifest";
import { countManifest } from "./count/manifest";
import { renameManifest } from "./rename/manifest";
import { timeManifest } from "./time/manifest";
import type { ToolManifest } from "./types";

export const toolRegistry: readonly ToolManifest[] = [
  countManifest,
  timeManifest,
  awakeManifest,
  renameManifest,
];
export const findTool = (id: string): ToolManifest | undefined =>
  toolRegistry.find((tool) => tool.id === id);
