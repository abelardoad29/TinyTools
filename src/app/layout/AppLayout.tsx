import { useState, type ReactNode } from "react";
import type { EntitlementId } from "../../core/entitlements/types";
import { CommandPalette } from "../command-palette/CommandPalette";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children, owned }: { children: ReactNode; owned: Set<EntitlementId> }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar owned={owned} onSearch={() => setPaletteOpen(true)} />
      <div className="app-main">{children}</div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} owned={owned} />
    </div>
  );
}
