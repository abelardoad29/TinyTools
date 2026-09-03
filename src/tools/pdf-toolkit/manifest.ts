import type { ToolManifest } from "../types";

export const pdfToolkitManifest = {
  id: "pdf-toolkit",
  name: "PDF Toolkit.",
  tagline: "Merge, split, rotate, number, and build PDFs.",
  description:
    "Merge several PDFs, split one into parts, pull out specific pages, rotate, turn images into a PDF, add page numbers, and read or clean document metadata — all in your browser.",
  category: "PDF",
  entitlement: "tool.pdf-toolkit",
  icon: "file-text",
  route: "/tools/pdf-toolkit",
  free: true,
  featured: true,
  keywords: [
    "merge pdf",
    "split pdf",
    "combine pdf",
    "rotate pdf",
    "extract pages",
    "images to pdf",
    "jpg to pdf",
    "page numbers",
    "pdf metadata",
    "pdf",
  ],
  implemented: true,
} satisfies ToolManifest;
