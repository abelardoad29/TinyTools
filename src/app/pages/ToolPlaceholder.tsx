import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { ToolShell } from "../../components/tool-shell/ToolShell";
import { getProduct } from "../../core/catalog/productCatalog";
import type { ToolManifest } from "../../tools/types";

const formatPrice = (toolId: string): string => {
  const product = getProduct(toolId);
  if (!product || product.pricingMode === "free") return "Free";
  if (product.pricingMode === "pwyw") return "Pay what you want";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(
    (product.priceCents ?? 0) / 100,
  );
};

export function ToolPlaceholder({ tool, locked }: { tool: ToolManifest; locked: boolean }) {
  const navigate = useNavigate();
  return (
    <ToolShell tool={tool}>
      <section className="placeholder">
        <div className="placeholder-icon">{locked ? <LockKeyhole size={24} /> : "·"}</div>
        <p className="eyebrow">{locked ? formatPrice(tool.id) : "Coming soon"}</p>
        <h1>{locked ? `${tool.name} is available to discover.` : `${tool.name} is yours.`}</h1>
        <p>{tool.description}</p>
        <button
          className="secondary-button"
          onClick={() => void navigate(locked ? "/discover" : "/")}
        >
          {locked ? "Back to Discover" : "Back to your tools"}
        </button>
      </section>
    </ToolShell>
  );
}
