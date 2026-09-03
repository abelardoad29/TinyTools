import type { ReactNode } from "react";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ToolManifest } from "../../tools/types";
import { ToolIcon } from "../ui/ToolIcon";
import { ToolContent } from "./ToolContent";

export function ToolShell({
  tool,
  children,
  menu,
}: {
  tool: ToolManifest;
  children: ReactNode;
  menu?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <main className="tool-shell">
      <header className="tool-header">
        <button className="icon-button" onClick={() => void navigate("/")} aria-label="Back to Hub">
          <ArrowLeft size={19} />
        </button>
        <div className="tool-title">
          <span className="tool-title-icon">
            <ToolIcon icon={tool.icon} />
          </span>
          <span>{tool.name}</span>
        </div>
        {menu ?? (
          <button className="icon-button" aria-label={`More options for ${tool.name}`} disabled>
            <MoreHorizontal size={19} />
          </button>
        )}
      </header>
      <div className="tool-content">
        {children}
        <ToolContent toolId={tool.id} toolName={tool.name} />
      </div>
    </main>
  );
}
