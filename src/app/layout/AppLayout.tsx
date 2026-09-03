import { useState, type ReactNode } from "react";
import { CommandPalette } from "../command-palette/CommandPalette";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar onSearch={() => setPaletteOpen(true)} />
      <div className="app-main">{children}</div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
