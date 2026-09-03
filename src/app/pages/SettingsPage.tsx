import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { LumbreSignature } from "../../components/brand/LumbreSignature";
import { formatUsd, proProduct } from "../../core/catalog/proProduct";
import { entitlementService } from "../../core/entitlements/GumroadEntitlementProvider";
import { useAppStore, useIsPro, type ThemePreference } from "../../stores/appStore";

const options: { id: ThemePreference; label: string; icon: typeof Monitor }[] = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

function ProSection() {
  const isPro = useIsPro();
  const syncOwned = useAppStore((s) => s.syncOwned);
  const [licenseKey, setLicenseKey] = useState("");
  const [status, setStatus] = useState<"idle" | "checking">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const activate = async (): Promise<void> => {
    setStatus("checking");
    setError(null);
    const result = await entitlementService.redeem(licenseKey);
    setStatus("idle");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLicenseKey("");
    await syncOwned();
  };

  const deactivate = async (): Promise<void> => {
    await entitlementService.deactivate();
    setConfirmingRemoval(false);
    await syncOwned();
  };

  if (isPro)
    return (
      <section className="settings-group">
        <div>
          <h2>TinyTools Pro</h2>
          <p>Advanced features are unlocked across every tool.</p>
        </div>
        <div className="pro-status">
          <p className="pro-active">
            <Check size={16} /> Pro is active on this device.
          </p>
          {confirmingRemoval ? (
            <div className="confirm-block">
              <p>
                Remove your license from this device? Pro features lock again here, and you&apos;ll
                need to paste the key to turn them back on. Your purchase isn&apos;t affected.
              </p>
              <div className="confirm-actions">
                <button className="danger-action" onClick={() => void deactivate()}>
                  Yes, remove it
                </button>
                <button className="secondary-action" onClick={() => setConfirmingRemoval(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="secondary-action" onClick={() => setConfirmingRemoval(true)}>
              Remove license from this device
            </button>
          )}
        </div>
      </section>
    );

  return (
    <section className="settings-group">
      <div>
        <h2>TinyTools Pro</h2>
        <p>
          One payment unlocks the advanced features in every tool — session history, JSON ↔ CSV, the
          regex tester, the clipboard shelf, and batch QR sheets.
        </p>
      </div>
      <div className="pro-status">
        {proProduct.purchaseUrl ? (
          <>
            <a
              className="primary-action"
              href={proProduct.purchaseUrl}
              target="_blank"
              rel="noreferrer"
            >
              Get TinyTools Pro
            </a>
            <p className="pro-price">
              Pay what you want — from {formatUsd(proProduct.minPriceCents)},{" "}
              {formatUsd(proProduct.suggestedPriceCents)} suggested. No subscription.
            </p>
          </>
        ) : null}
        <label className="field-label">
          Already purchased? Enter your license key
          <input
            value={licenseKey}
            onChange={(event) => setLicenseKey(event.target.value)}
            placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
          />
        </label>
        {error ? <p className="dev-error">{error}</p> : null}
        <button
          className="secondary-action"
          onClick={() => void activate()}
          disabled={!licenseKey.trim() || status === "checking"}
        >
          {status === "checking" ? "Checking…" : "Activate"}
        </button>
      </div>
    </section>
  );
}

export function SettingsPage() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  return (
    <main className="settings-page">
      <header>
        <p className="eyebrow">Preferences</p>
        <h1>Settings</h1>
        <p>Make TinyTools feel at home on this computer.</p>
      </header>
      <ProSection />
      <section className="settings-group">
        <div>
          <h2>Appearance</h2>
          <p>Choose how TinyTools looks.</p>
        </div>
        <div className="theme-picker" role="radiogroup" aria-label="Theme">
          {options.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="radio"
              aria-checked={theme === id}
              className={theme === id ? "selected" : ""}
              onClick={() => void setTheme(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </section>
      <section className="settings-group about">
        <div>
          <h2>About</h2>
          <p>Built by Lumbre Studio</p>
        </div>
        <dl>
          <div>
            <dt>Version</dt>
            <dd>0.1.0</dd>
          </div>
          <div>
            <dt>Storage</dt>
            <dd>Local, on this device</dd>
          </div>
          <div>
            <dt>Studio</dt>
            <dd>
              <LumbreSignature variant="compact" />
            </dd>
          </div>
        </dl>
      </section>
      <p className="settings-footnote">
        Nothing you type here leaves your browser. More preferences will appear as each tool earns
        them.
      </p>
    </main>
  );
}
