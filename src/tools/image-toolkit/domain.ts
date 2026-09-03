import type { Result } from "../../lib/result";

export type { Result } from "../../lib/result";

export type ImageMode =
  "resize" | "compress" | "convert" | "crop" | "watermark" | "border" | "colors";

export type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

export const OUTPUT_FORMATS: { id: OutputFormat; label: string; extension: string }[] = [
  { id: "image/png", label: "PNG", extension: "png" },
  { id: "image/jpeg", label: "JPG", extension: "jpg" },
  { id: "image/webp", label: "WebP", extension: "webp" },
];

export const extensionFor = (format: OutputFormat): string =>
  OUTPUT_FORMATS.find((item) => item.id === format)?.extension ?? "png";

export const replaceExtension = (filename: string, extension: string): string => {
  const base = filename.replace(/\.[^./\\]+$/, "");
  return `${base}.${extension}`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export type ResizeMode = "width" | "height" | "percent" | "fit";
export type ResizeOptions = {
  mode: ResizeMode;
  /** Target pixels for width/height/fit modes, or a percentage for "percent". */
  value: number;
  /** Never scale an image up past its original size. */
  preventUpscale: boolean;
};

export type Dimensions = { width: number; height: number };

export const computeResizeDimensions = (source: Dimensions, options: ResizeOptions): Dimensions => {
  const { width, height } = source;
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const ratio = width / height;
  const value = Math.max(1, options.value);

  let target: Dimensions;
  switch (options.mode) {
    case "width":
      target = { width: value, height: Math.round(value / ratio) };
      break;
    case "height":
      target = { width: Math.round(value * ratio), height: value };
      break;
    case "percent":
      target = {
        width: Math.round((width * value) / 100),
        height: Math.round((height * value) / 100),
      };
      break;
    case "fit": {
      const scale = Math.min(value / width, value / height);
      target = { width: Math.round(width * scale), height: Math.round(height * scale) };
      break;
    }
  }

  if (options.preventUpscale && (target.width > width || target.height > height)) {
    return { width, height };
  }
  return { width: Math.max(1, target.width), height: Math.max(1, target.height) };
};

export const parseAspectRatio = (input: string): Result<number> => {
  const trimmed = input.trim();
  const pair = /^(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)$/i.exec(trimmed);
  if (pair) {
    const w = Number(pair[1]);
    const h = Number(pair[2]);
    if (w <= 0 || h <= 0) return { ok: false, error: "Both sides must be greater than zero." };
    return { ok: true, value: w / h };
  }
  const single = Number(trimmed);
  if (Number.isFinite(single) && single > 0) return { ok: true, value: single };
  return { ok: false, error: "Use a ratio like 16:9, 1:1 or 4:3." };
};

export type CropRect = { x: number; y: number; width: number; height: number };

/** Largest centered rectangle of the given aspect ratio that fits inside the source. */
export const centeredCrop = (source: Dimensions, aspect: number): CropRect => {
  const sourceAspect = source.width / source.height;
  const width = sourceAspect > aspect ? Math.round(source.height * aspect) : source.width;
  const height = sourceAspect > aspect ? source.height : Math.round(source.width / aspect);
  return {
    x: Math.round((source.width - width) / 2),
    y: Math.round((source.height - height) / 2),
    width,
    height,
  };
};

export type WatermarkPosition =
  "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export const WATERMARK_POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: "bottom-right", label: "Bottom right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "top-right", label: "Top right" },
  { id: "top-left", label: "Top left" },
  { id: "center", label: "Center" },
];

/** Where to draw watermark text, given the already-measured text box. */
export const watermarkOrigin = (
  canvas: Dimensions,
  text: Dimensions,
  position: WatermarkPosition,
  margin: number,
): { x: number; y: number } => {
  const right = canvas.width - text.width - margin;
  const bottom = canvas.height - text.height - margin;
  switch (position) {
    case "top-left":
      return { x: margin, y: margin };
    case "top-right":
      return { x: Math.max(margin, right), y: margin };
    case "bottom-left":
      return { x: margin, y: Math.max(margin, bottom) };
    case "bottom-right":
      return { x: Math.max(margin, right), y: Math.max(margin, bottom) };
    case "center":
      return {
        x: Math.max(margin, Math.round((canvas.width - text.width) / 2)),
        y: Math.max(margin, Math.round((canvas.height - text.height) / 2)),
      };
  }
};

export type Swatch = { hex: string; count: number };

const toHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;

/**
 * Dominant colors by bucketing RGB into a coarse grid, which keeps near-identical
 * shades from each claiming their own slot in the palette.
 */
export const dominantColors = (pixels: Uint8ClampedArray, max = 6): Swatch[] => {
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3] ?? 0;
    if (alpha < 128) continue;
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, max)
    .map((bucket) => ({
      hex: toHex(
        Math.round(bucket.r / bucket.count),
        Math.round(bucket.g / bucket.count),
        Math.round(bucket.b / bucket.count),
      ),
      count: bucket.count,
    }));
};

export const FREE_BATCH_LIMIT = 1;
