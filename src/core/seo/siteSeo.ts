// Change this one constant when the custom domain goes live, and mirror it in the
// static tags in index.html, public/sitemap.xml and public/robots.txt.
export const SITE_URL = "https://tiny-tools-eta.vercel.app";

export const SITE_NAME = "TinyTools";
export const OG_IMAGE = `${SITE_URL}/og-cover.png`;

export type RouteSeo = { title: string; description: string };

const DEFAULT_SEO: RouteSeo = {
  title: "TinyTools — Small, free tools that work in your browser",
  description:
    "A hub of small, focused tools: counters, timers, JSON and Base64, case conversion, calculators, QR codes and barcodes. Free, no install, nothing leaves your browser.",
};

/**
 * Search-oriented copy, kept separate from the functional tool manifests the same way
 * the commercial catalog is (CODEX.md §8) — titles lead with what people actually
 * search for, not with the product's own naming.
 */
const TOOL_SEO: Record<string, RouteSeo> = {
  count: {
    title: "Free Online Counter — Tally Counter with Goals | TinyTools",
    description:
      "A free online tally counter: name multiple counters, set goals, reset daily or per session, and keep local history. Works offline, nothing leaves your browser.",
  },
  time: {
    title: "Online Timer, Stopwatch, Pomodoro & Countdown — Free | TinyTools",
    description:
      "A free online timer, stopwatch with laps, Pomodoro cycles and date countdowns in one place. No sign-up, works offline, runs entirely in your browser.",
  },
  "dev-toolkit": {
    title: "JSON Formatter, Base64, UUID, Hash & Regex Tester | TinyTools",
    description:
      "Free developer tools in one page: format and validate JSON, encode Base64, generate UUIDs, hash text (SHA-1/256/384/512), test regex, decode JWTs and convert Unix time.",
  },
  "text-toolkit": {
    title: "Case Converter, Word Counter, Text Diff & Cleaner | TinyTools",
    description:
      "Free text tools: convert case (camelCase, snake_case, Title Case), count words and characters, clean whitespace, find and replace, sort lines, make slugs and diff text.",
  },
  "calculators-toolkit": {
    title: "Unit Converter, Percentage, DPI & Date Calculators | TinyTools",
    description:
      "Free calculators in one place: convert units, storage sizes and coordinates, solve DPI and aspect ratio, diff dates, work percentages, rule of three and decimal hours.",
  },
  "qr-toolkit": {
    title: "Free QR Code Generator, WiFi QR & Barcode Maker | TinyTools",
    description:
      "Generate QR codes for text and URLs, WiFi QR codes that connect on scan, and barcodes (CODE128, EAN-13, UPC). Download PNG or SVG. Free, no watermark, no sign-up.",
  },
};

const PAGE_SEO: Record<string, RouteSeo> = {
  "/": DEFAULT_SEO,
  "/tools": {
    title: "All Tools — Free Browser Utilities | TinyTools",
    description:
      "Every TinyTools utility in one list: counters, timers, developer tools, text tools, calculators, QR codes and barcodes. All free, all running in your browser.",
  },
  "/discover": {
    title: "Discover More Tools | TinyTools",
    description:
      "More small utilities on the way. See what TinyTools is building next — free, focused, browser-based tools with no install and no account.",
  },
  "/settings": {
    title: "Settings | TinyTools",
    description:
      "Choose your theme and manage your TinyTools Pro license. Everything is stored locally on your device.",
  },
};

export const seoForPath = (pathname: string): RouteSeo => {
  const toolMatch = /^\/tools\/([^/]+)$/.exec(pathname);
  if (toolMatch?.[1]) return TOOL_SEO[toolMatch[1]] ?? DEFAULT_SEO;
  return PAGE_SEO[pathname] ?? DEFAULT_SEO;
};

export const indexablePaths = (): string[] => [
  "/",
  "/tools",
  ...Object.keys(TOOL_SEO).map((id) => `/tools/${id}`),
];
