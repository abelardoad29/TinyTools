const LUMBRE_URL = "https://lumbrestudio.com";

/**
 * Studio signature. The mark is a monochrome silhouette applied as a CSS mask so it
 * takes the current theme's text color instead of shipping a light and a dark asset.
 */
export function LumbreSignature({ variant = "full" }: { variant?: "full" | "compact" }) {
  return (
    <a className={`lumbre-signature ${variant}`} href={LUMBRE_URL} target="_blank" rel="noreferrer">
      <span className="lumbre-mark" aria-hidden="true" />
      <span>{variant === "compact" ? "Lumbre Studio" : "A Lumbre Studio product"}</span>
    </a>
  );
}
