import {
  CalendarDays,
  Coffee,
  FilePenLine,
  Hash,
  Layers3,
  LayoutGrid,
  ListPlus,
  MousePointerClick,
  Repeat2,
  Tags,
  Target,
  Timer,
  Users,
} from "lucide-react";
import type { ToolManifest } from "../../tools/types";

const icons = {
  hash: Hash,
  timer: Timer,
  coffee: Coffee,
  "file-pen": FilePenLine,
  "list-plus": ListPlus,
  target: Target,
  tags: Tags,
  users: Users,
  repeat: Repeat2,
  mouse: MousePointerClick,
  layers: Layers3,
  calendar: CalendarDays,
  "layout-grid": LayoutGrid,
};

export function ToolIcon({ icon, size = 20 }: { icon: ToolManifest["icon"]; size?: number }) {
  const Icon = icons[icon];
  return <Icon aria-hidden="true" size={size} strokeWidth={1.8} />;
}
