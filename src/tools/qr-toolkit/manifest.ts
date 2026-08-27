import type { ToolManifest } from "../types";

export const qrToolkitManifest = {
  id: "qr-toolkit",
  name: "QR & Barcode Toolkit.",
  tagline: "QR codes, WiFi QR, barcodes, and printable batches.",
  description:
    "Generate QR codes for text and URLs, WiFi QR codes ready to scan and connect, common barcode formats, and printable batches from a list — all local, all in one place.",
  category: "QR",
  entitlement: "tool.qr-toolkit",
  icon: "qr-code",
  route: "/tools/qr-toolkit",
  free: true,
  featured: true,
  keywords: [
    "qr code",
    "qr generator",
    "wifi qr",
    "barcode",
    "code128",
    "ean13",
    "upc",
    "batch",
    "print",
  ],
  implemented: true,
} satisfies ToolManifest;
