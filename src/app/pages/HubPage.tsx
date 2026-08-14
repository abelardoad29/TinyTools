import { ArrowRight, LockKeyhole, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToolIcon } from "../../components/ui/ToolIcon";
import type { EntitlementId } from "../../core/entitlements/types";
import { getProduct } from "../../core/catalog/productCatalog";
import { canUseTool } from "../../stores/appStore";
import { toolRegistry } from "../../tools/registry";
import type { ToolManifest } from "../../tools/types";

function ToolRow({ tool, unlocked }: { tool: ToolManifest; unlocked: boolean }) {
  const navigate = useNavigate();
  const product = getProduct(tool.id);
  const suffix =
    !unlocked && product?.priceCents
      ? `$${product.priceCents / 100}`
      : !unlocked
        ? "Free"
        : tool.implemented
          ? "Open"
          : "Owned";
  return (
    <button className="tool-row" onClick={() => void navigate(unlocked ? tool.route : "/discover")}>
      <span className="tool-row-icon">
        <ToolIcon icon={tool.icon} size={22} />
      </span>
      <span className="tool-row-copy">
        <strong>{tool.name}</strong>
        <small>{tool.tagline}</small>
      </span>
      <span className={`tool-status ${unlocked ? "" : "locked"}`}>
        {!unlocked ? <LockKeyhole size={13} /> : null}
        {suffix}
      </span>
      <ArrowRight className="tool-arrow" size={17} />
    </button>
  );
}

export function HubPage({
  owned,
  view = "home",
}: {
  owned: Set<EntitlementId>;
  view?: "home" | "tools" | "discover";
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      toolRegistry.filter((tool) =>
        `${tool.name} ${tool.tagline} ${tool.keywords.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  const yourTools = filtered.filter((tool) => canUseTool(tool.free, tool.entitlement, owned));
  const discover = filtered.filter((tool) => !canUseTool(tool.free, tool.entitlement, owned));
  return (
    <main className="hub">
      <header className="hub-header">
        <div>
          <p className="eyebrow">{view === "discover" ? "Catalog" : "Good to have you here"}</p>
          <h1>
            {view === "discover"
              ? "Discover"
              : view === "tools"
                ? "Your Tools"
                : "Small tools. Ready when you are."}
          </h1>
          <p>
            {view === "discover"
              ? "A few focused additions, when you need them."
              : "Everything you own, in one quiet place."}
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
      {view !== "discover" ? (
        <section className="tool-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your tools</p>
              <h2>Pick up where you left off</h2>
            </div>
            <span>{yourTools.length} tools</span>
          </div>
          <div className="tool-list">
            {yourTools.map((tool) => (
              <ToolRow key={tool.id} tool={tool} unlocked />
            ))}
          </div>
        </section>
      ) : null}
      {view !== "tools" ? (
        <section className="tool-section discover-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Discover</p>
              <h2>More, only when useful</h2>
            </div>
            <span>{discover.length} available</span>
          </div>
          <div className="tool-list subdued">
            {discover.map((tool) => (
              <ToolRow key={tool.id} tool={tool} unlocked={false} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
