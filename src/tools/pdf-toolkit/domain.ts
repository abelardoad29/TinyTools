import type { Result } from "../../lib/result";

export type { Result } from "../../lib/result";

export type PdfMode = "merge" | "split" | "extract" | "rotate" | "images" | "numbers" | "metadata";

/**
 * Parses page selections the way people write them: "1-3, 7, 10-12".
 * Returns zero-based indices, de-duplicated and in ascending order.
 */
export const parsePageRanges = (input: string, pageCount: number): Result<number[]> => {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Enter at least one page or range." };

  const indices = new Set<number>();
  for (const part of trimmed.split(",")) {
    const chunk = part.trim();
    if (!chunk) continue;

    const range = /^(\d+)\s*-\s*(\d+)$/.exec(chunk);
    if (range) {
      const from = Number(range[1]);
      const to = Number(range[2]);
      if (from < 1 || to < 1) return { ok: false, error: "Pages start at 1." };
      if (from > pageCount || to > pageCount)
        return { ok: false, error: `This PDF only has ${pageCount} pages.` };
      const [start, end] = from <= to ? [from, to] : [to, from];
      for (let page = start; page <= end; page += 1) indices.add(page - 1);
      continue;
    }

    const single = Number(chunk);
    if (!Number.isInteger(single)) return { ok: false, error: `"${chunk}" isn't a page number.` };
    if (single < 1) return { ok: false, error: "Pages start at 1." };
    if (single > pageCount) return { ok: false, error: `This PDF only has ${pageCount} pages.` };
    indices.add(single - 1);
  }

  if (indices.size === 0) return { ok: false, error: "Enter at least one page or range." };
  return { ok: true, value: [...indices].sort((a, b) => a - b) };
};

/** Splits a page count into consecutive chunks of at most `size` pages. */
export const chunkPages = (pageCount: number, size: number): number[][] => {
  const perChunk = Math.max(1, Math.floor(size));
  const chunks: number[][] = [];
  for (let start = 0; start < pageCount; start += perChunk) {
    chunks.push(Array.from({ length: Math.min(perChunk, pageCount - start) }, (_, i) => start + i));
  }
  return chunks;
};

export type Rotation = 0 | 90 | 180 | 270;
export const ROTATIONS: { id: Rotation; label: string }[] = [
  { id: 90, label: "90° right" },
  { id: 180, label: "180°" },
  { id: 270, label: "90° left" },
];

export const normalizeRotation = (current: number, delta: number): Rotation => {
  const value = (((current + delta) % 360) + 360) % 360;
  return (value - (value % 90)) as Rotation;
};

export type NumberPosition = "bottom-center" | "bottom-right" | "bottom-left";
export const NUMBER_POSITIONS: { id: NumberPosition; label: string }[] = [
  { id: "bottom-center", label: "Bottom center" },
  { id: "bottom-right", label: "Bottom right" },
  { id: "bottom-left", label: "Bottom left" },
];

/** Baseline position for a page number, given the page box and measured text width. */
export const pageNumberOrigin = (
  page: { width: number; height: number },
  textWidth: number,
  position: NumberPosition,
  margin: number,
): { x: number; y: number } => {
  const y = margin;
  switch (position) {
    case "bottom-left":
      return { x: margin, y };
    case "bottom-right":
      return { x: Math.max(margin, page.width - textWidth - margin), y };
    case "bottom-center":
      return { x: Math.max(margin, (page.width - textWidth) / 2), y };
  }
};

export const outputName = (source: string, suffix: string): string => {
  const base = source.replace(/\.pdf$/i, "");
  return `${base}-${suffix}.pdf`;
};

export const FREE_PAGE_LIMIT = 30;
