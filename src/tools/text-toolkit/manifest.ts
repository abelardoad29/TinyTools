import type { ToolManifest } from "../types";

export const textToolkitManifest = {
  id: "text-toolkit",
  name: "Text Toolkit.",
  tagline: "Case, cleanup, counting, find/replace, diff, and more.",
  description:
    "Convert case, count characters and words, clean up whitespace, find and replace, sort and dedupe lines, make slugs, generate lorem ipsum, compare text, and keep a local snippet shelf — all local, all in one place.",
  category: "Text",
  entitlement: "tool.text-toolkit",
  icon: "type",
  route: "/tools/text-toolkit",
  free: true,
  featured: true,
  keywords: [
    "case",
    "uppercase",
    "lowercase",
    "camelcase",
    "snakecase",
    "character count",
    "word count",
    "clean text",
    "find replace",
    "sort lines",
    "dedupe",
    "slug",
    "lorem ipsum",
    "diff",
    "clipboard",
    "text",
  ],
  implemented: true,
} satisfies ToolManifest;
