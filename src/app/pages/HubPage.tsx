import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdBanner } from "../../components/ads/AdBanner";
import { ToolIcon } from "../../components/ui/ToolIcon";
import { isTauri } from "../../core/storage/storage";
import { useIsPro } from "../../stores/appStore";
import { visibleTools } from "../../tools/registry";
import type { ToolManifest } from "../../tools/types";

function ToolRow({ tool }: { tool: ToolManifest }) {
  const navigate = useNavigate();
  return (
    <button className="tool-row" onClick={() => void navigate(tool.route)}>
      <span className="tool-row-icon">
        <ToolIcon icon={tool.icon} size={22} />
      </span>
      <span className="tool-row-copy">
        <strong>{tool.name}</strong>
        <small>{tool.tagline}</small>
      </span>
      <span className="tool-status">Open</span>
      <ArrowRight className="tool-arrow" size={17} />
    </button>
  );
}

export function HubPage({ view = "home" }: { view?: "home" | "tools" }) {
  const [query, setQuery] = useState("");
  const isPro = useIsPro();
  const filtered = useMemo(
    () =>
      visibleTools.filter((tool) =>
        `${tool.name} ${tool.tagline} ${tool.keywords.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <main className="hub">
      <header className="hub-header">
        <div>
          <p className="eyebrow">{view === "tools" ? "Every tool" : "Free, no install"}</p>
          <h1>{view === "tools" ? "All tools" : "Small tools. Ready when you are."}</h1>
          <p>
            Everything runs in your browser and works offline. Nothing you type ever leaves your
            device.
          </p>
        </div>
        <label className="hub-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools"
            aria-label="Search tools"
          />
          <kbd>⌘K</kbd>
        </label>
      </header>
      <section className="tool-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tools</p>
            <h2>Pick one and go</h2>
          </div>
          <span>{filtered.length} tools</span>
        </div>
        <div className="tool-list">
          {filtered.map((tool) => (
            <ToolRow key={tool.id} tool={tool} />
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="count-empty">
            <strong>No tool matches “{query}”.</strong>
            <span>Try a different word — or tell us what you need.</span>
          </div>
        ) : null}
      </section>
      {!isTauri() && !isPro ? <AdBanner /> : null}
    </main>
  );
}
