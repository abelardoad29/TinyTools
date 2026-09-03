import { LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { proProduct } from "../../core/catalog/proProduct";

export function ProLock({ feature }: { feature: string }) {
  const navigate = useNavigate();
  return (
    <div className="pro-lock">
      <LockKeyhole size={20} />
      <p>
        <strong>{feature}</strong> is part of TinyTools Pro — one payment, unlocked in every tool,
        forever.
      </p>
      {proProduct.purchaseUrl ? (
        <div className="pro-lock-actions">
          <a
            className="primary-action"
            href={proProduct.purchaseUrl}
            target="_blank"
            rel="noreferrer"
          >
            Get TinyTools Pro
          </a>
          <button className="pro-lock-link" onClick={() => void navigate("/settings")}>
            Already bought it?
          </button>
        </div>
      ) : (
        <button className="secondary-button" onClick={() => void navigate("/settings")}>
          Unlock Pro
        </button>
      )}
    </div>
  );
}
