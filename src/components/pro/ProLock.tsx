import { LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProLock({ feature }: { feature: string }) {
  const navigate = useNavigate();
  return (
    <div className="pro-lock">
      <LockKeyhole size={20} />
      <p>
        <strong>{feature}</strong> is part of TinyTools Pro.
      </p>
      <button className="secondary-button" onClick={() => void navigate("/settings")}>
        Unlock Pro
      </button>
    </div>
  );
}
