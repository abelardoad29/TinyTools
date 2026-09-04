import { Home, Search, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { LumbreSignature } from "../../components/brand/LumbreSignature";
import { ToolIcon } from "../../components/ui/ToolIcon";
import { visibleTools } from "../../tools/registry";

export function Sidebar({ onSearch }: { onSearch: () => void }) {
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
        <button onClick={onSearch}>
          <Search size={17} />
          Search <kbd>⌘K</kbd>
        </button>
      </nav>
      <div className="nav-section">
        <p>Tools</p>
        {visibleTools.map((tool) => (
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
      <div className="sidebar-footer">
        <LumbreSignature />
        <NavLink className="sidebar-footer-link" to="/privacy">
          Privacy
        </NavLink>
      </div>
    </aside>
  );
}
