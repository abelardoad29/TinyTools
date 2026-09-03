import { describe, expect, it } from "vitest";
import {
  chunkPages,
  normalizeRotation,
  outputName,
  pageNumberOrigin,
  parsePageRanges,
} from "../domain";

describe("parsePageRanges", () => {
  it("reads single pages, ranges and mixed lists as zero-based indices", () => {
    expect(parsePageRanges("1-3, 7, 10-12", 12)).toEqual({
      ok: true,
      value: [0, 1, 2, 6, 9, 10, 11],
    });
  });

  it("de-duplicates overlapping selections", () => {
    expect(parsePageRanges("1-3, 2, 3-4", 10)).toEqual({ ok: true, value: [0, 1, 2, 3] });
  });

  it("accepts a reversed range", () => {
    expect(parsePageRanges("5-3", 10)).toEqual({ ok: true, value: [2, 3, 4] });
  });

  it("rejects pages past the end of the document", () => {
    const result = parsePageRanges("1-99", 10);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("10 pages");
  });

  it("rejects page zero and non-numbers", () => {
    expect(parsePageRanges("0", 10).ok).toBe(false);
    expect(parsePageRanges("abc", 10).ok).toBe(false);
  });

  it("rejects an empty selection", () => {
    expect(parsePageRanges("   ", 10).ok).toBe(false);
    expect(parsePageRanges(" , , ", 10).ok).toBe(false);
  });
});

describe("chunkPages", () => {
  it("splits into equal chunks", () => {
    expect(chunkPages(6, 2)).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
    ]);
  });

  it("leaves a shorter final chunk", () => {
    expect(chunkPages(5, 2)).toEqual([[0, 1], [2, 3], [4]]);
  });

  it("treats a chunk size below one as one", () => {
    expect(chunkPages(3, 0)).toEqual([[0], [1], [2]]);
  });
});

describe("normalizeRotation", () => {
  it("wraps past a full turn", () => {
    expect(normalizeRotation(270, 90)).toBe(0);
    expect(normalizeRotation(0, 90)).toBe(90);
  });

  it("handles negative rotation", () => {
    expect(normalizeRotation(0, -90)).toBe(270);
  });
});

describe("pageNumberOrigin", () => {
  const page = { width: 600, height: 800 };

  it("centers and right-aligns within the margin", () => {
    expect(pageNumberOrigin(page, 40, "bottom-center", 30)).toEqual({ x: 280, y: 30 });
    expect(pageNumberOrigin(page, 40, "bottom-right", 30)).toEqual({ x: 530, y: 30 });
    expect(pageNumberOrigin(page, 40, "bottom-left", 30)).toEqual({ x: 30, y: 30 });
  });

  it("keeps wide text inside the page", () => {
    expect(pageNumberOrigin(page, 590, "bottom-right", 30).x).toBe(30);
  });
});

describe("outputName", () => {
  it("appends a suffix and keeps a single .pdf extension", () => {
    expect(outputName("report.pdf", "merged")).toBe("report-merged.pdf");
    expect(outputName("REPORT.PDF", "1")).toBe("REPORT-1.pdf");
    expect(outputName("no-extension", "split")).toBe("no-extension-split.pdf");
  });
});
