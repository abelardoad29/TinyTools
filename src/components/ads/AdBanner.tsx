import { useEffect } from "react";

const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined;
const ADSENSE_SLOT_ID = import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined;

let scriptRequested = false;

function loadAdsenseScript(clientId: string): void {
  if (scriptRequested) return;
  scriptRequested = true;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  document.head.appendChild(script);
}

/**
 * Renders nothing until VITE_ADSENSE_CLIENT_ID/VITE_ADSENSE_SLOT_ID are configured
 * (see .env.example) — inert until there's an approved AdSense account and a live
 * domain (Fase C). Callers are responsible for only rendering this for free users
 * on the web build (never in the Tauri desktop app, never for Pro users).
 */
export function AdBanner() {
  useEffect(() => {
    if (!ADSENSE_CLIENT_ID) return;
    loadAdsenseScript(ADSENSE_CLIENT_ID);
    try {
      const adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ?? [];
      adsbygoogle.push({});
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = adsbygoogle;
    } catch {
      // AdSense loads asynchronously — a push before it's ready is harmless to skip.
    }
  }, []);

  if (!ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID) return null;

  return (
    <div className="ad-banner">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_SLOT_ID}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}
