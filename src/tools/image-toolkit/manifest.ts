import type { ToolManifest } from "../types";

export const imageToolkitManifest = {
  id: "image-toolkit",
  name: "Image Toolkit.",
  tagline: "Resize, compress, convert, crop, watermark.",
  description:
    "Resize, compress, convert between PNG/JPG/WebP, crop to a ratio, add a watermark or border, and pull the dominant colors out of an image — all processed in your browser.",
  category: "Images",
  entitlement: "tool.image-toolkit",
  icon: "image",
  route: "/tools/image-toolkit",
  free: true,
  featured: true,
  keywords: [
    "resize image",
    "compress image",
    "convert image",
    "png to jpg",
    "webp",
    "crop image",
    "watermark",
    "color palette",
    "image",
  ],
  implemented: true,
} satisfies ToolManifest;
