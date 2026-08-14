import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { EntitlementId } from "../../core/entitlements/types";
import { toolRegistry } from "../../tools/registry";
import { canUseTool } from "../../stores/appStore";
import { ToolIcon } from "../../components/ui/ToolIcon";

export function CommandPalette({
  open,
  onOpenChange,
  owned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owned: Set<EntitlementId>;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange, open]);
  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);
  if (!open) return null;
  const results = toolRegistry.filter((tool) =>
    `${tool.name} ${tool.tagline} ${tool.keywords.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const select = (route: string): void => {
    void navigate(route);
    onOpenChange(false);
  };
  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={() => onOpenChange(false)}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search TinyTools"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <label className="palette-search">
          <Search size={20} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools and actions…"
            aria-label="Search tools"
          />
        </label>
        <div className="palette-results">
          {results.map((tool) => {
            const unlocked = canUseTool(tool.free, tool.entitlement, owned);
            return (
              <button key={tool.id} onClick={() => select(unlocked ? tool.route : "/discover")}>
                <span className="palette-result-icon">
                  <ToolIcon icon={tool.icon} />
                </span>
                <span>
                  <strong>{tool.name}</strong>
                  <small>{tool.tagline}</small>
                </span>
                <span className="palette-state">
                  {unlocked ? (tool.implemented ? "Open" : "Owned") : "Discover"}
                </span>
              </button>
            );
          })}
        </div>
        <footer>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </footer>
      </div>
    </div>
  );
}
