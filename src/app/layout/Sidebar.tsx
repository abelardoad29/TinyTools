import { Compass, Home, Search, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ToolIcon } from "../../components/ui/ToolIcon";
import { toolRegistry } from "../../tools/registry";
import type { EntitlementId } from "../../core/entitlements/types";
import { canUseTool } from "../../stores/appStore";

export function Sidebar({ owned, onSearch }: { owned: Set<EntitlementId>; onSearch: () => void }) {
  const ownedTools = toolRegistry.filter((tool) => canUseTool(tool.free, tool.entitlement, owned));
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">T</span>
        <span>TinyTools</span>
      </div>
      <nav className="nav-primary" aria-label="Main navigation">
        <NavLink to="/" end>
          <Home size={17} />
          Home
        </NavLink>
        <NavLink to="/tools">
          <span className="nav-dot" />
          Your Tools
        </NavLink>
        <NavLink to="/discover">
          <Compass size={17} />
          Discover
        </NavLink>
        <button onClick={onSearch}>
          <Search size={17} />
          Search <kbd>⌘K</kbd>
        </button>
      </nav>
      <div className="nav-section">
        <p>Your tools</p>
        {ownedTools.map((tool) => (
          <NavLink key={tool.id} to={tool.route}>
            <ToolIcon icon={tool.icon} size={16} />
            {tool.name}
          </NavLink>
        ))}
      </div>
      <NavLink className="settings-link" to="/settings">
        <Settings size={17} />
        Settings
      </NavLink>
    </aside>
  );
}
