import type { ToolManifest } from "../types";

export const devToolkitManifest = {
  id: "dev-toolkit",
  name: "Dev Toolkit.",
  tagline: "JSON, Base64, UUID, hashes, regex, JWT, Unix time, CSV.",
  description:
    "Format and validate JSON, encode/decode Base64, generate UUIDs, hash text, test a regex, peek a JWT, convert Unix time, and swap JSON with CSV — all local, all in one place.",
  category: "Developer",
  entitlement: "tool.dev-toolkit",
  icon: "code",
  route: "/tools/dev-toolkit",
  free: true,
  featured: true,
  keywords: [
    "json",
    "base64",
    "uuid",
    "hash",
    "sha256",
    "regex",
    "jwt",
    "unix time",
    "timestamp",
    "csv",
    "developer",
  ],
  implemented: true,
} satisfies ToolManifest;
