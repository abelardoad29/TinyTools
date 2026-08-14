import type { EntitlementId } from "../core/entitlements/types";

export type ToolManifest = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  entitlement: EntitlementId;
  icon:
    | "hash"
    | "timer"
    | "coffee"
    | "file-pen"
    | "list-plus"
    | "target"
    | "tags"
    | "users"
    | "repeat"
    | "mouse"
    | "layers"
    | "calendar"
    | "layout-grid";
  route: `/tools/${string}`;
  free: boolean;
  featured?: boolean;
  keywords: string[];
  implemented: boolean;
};
