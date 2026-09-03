import { describe, expect, it } from "vitest";
import {
  centeredCrop,
  computeResizeDimensions,
  dominantColors,
  extensionFor,
  formatBytes,
  parseAspectRatio,
  replaceExtension,
  watermarkOrigin,
} from "../domain";

describe("computeResizeDimensions", () => {
  const source = { width: 1600, height: 900 };

  it("scales by width, keeping the aspect ratio", () => {
    expect(
      computeResizeDimensions(source, { mode: "width", value: 800, preventUpscale: true }),
    ).toEqual({ width: 800, height: 450 });
  });

  it("scales by height, keeping the aspect ratio", () => {
    expect(
      computeResizeDimensions(source, { mode: "height", value: 450, preventUpscale: true }),
    ).toEqual({ width: 800, height: 450 });
  });

  it("scales by percentage", () => {
    expect(
      computeResizeDimensions(source, { mode: "percent", value: 50, preventUpscale: true }),
    ).toEqual({ width: 800, height: 450 });
  });

  it("fits inside a square bound using the longest side", () => {
    expect(
      computeResizeDimensions(source, { mode: "fit", value: 800, preventUpscale: true }),
    ).toEqual({
      width: 800,
      height: 450,
    });
  });

  it("refuses to upscale when asked not to", () => {
    expect(
      computeResizeDimensions(source, { mode: "width", value: 3200, preventUpscale: true }),
    ).toEqual(source);
  });

  it("upscales when explicitly allowed", () => {
    expect(
      computeResizeDimensions(source, { mode: "width", value: 3200, preventUpscale: false }),
    ).toEqual({ width: 3200, height: 1800 });
  });
});

describe("parseAspectRatio", () => {
  it("accepts colon, slash and x separators", () => {
    expect(parseAspectRatio("16:9")).toEqual({ ok: true, value: 16 / 9 });
    expect(parseAspectRatio("4/3")).toEqual({ ok: true, value: 4 / 3 });
    expect(parseAspectRatio("3x2")).toEqual({ ok: true, value: 1.5 });
  });

  it("accepts a bare decimal", () => {
    expect(parseAspectRatio("1.5")).toEqual({ ok: true, value: 1.5 });
  });

  it("rejects nonsense and zero sides", () => {
    expect(parseAspectRatio("wide").ok).toBe(false);
    expect(parseAspectRatio("16:0").ok).toBe(false);
  });
});

describe("centeredCrop", () => {
  it("crops the sides of a landscape image to reach a square", () => {
    expect(centeredCrop({ width: 1600, height: 900 }, 1)).toEqual({
      x: 350,
      y: 0,
      width: 900,
      height: 900,
    });
  });

  it("crops top and bottom of a portrait image to reach 16:9", () => {
    const crop = centeredCrop({ width: 900, height: 1600 }, 16 / 9);
    expect(crop.width).toBe(900);
    expect(crop.height).toBe(506);
    expect(crop.x).toBe(0);
  });
});

describe("watermarkOrigin", () => {
  const canvas = { width: 1000, height: 500 };
  const text = { width: 200, height: 40 };

  it("places each corner inside the margin", () => {
    expect(watermarkOrigin(canvas, text, "top-left", 20)).toEqual({ x: 20, y: 20 });
    expect(watermarkOrigin(canvas, text, "bottom-right", 20)).toEqual({ x: 780, y: 440 });
  });

  it("centers the text", () => {
    expect(watermarkOrigin(canvas, text, "center", 20)).toEqual({ x: 400, y: 230 });
  });

  it("never pushes text outside the canvas when it barely fits", () => {
    const wide = { width: 990, height: 40 };
    const origin = watermarkOrigin(canvas, wide, "bottom-right", 20);
    expect(origin.x).toBe(20);
  });
});

describe("dominantColors", () => {
  it("ranks colors by how much of the image they cover", () => {
    // Three red pixels, one blue, one fully transparent (which must be ignored).
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255, 0, 255, 0, 0,
    ]);
    const colors = dominantColors(pixels);
    expect(colors[0]?.hex).toBe("#ff0000");
    expect(colors[0]?.count).toBe(3);
    expect(colors).toHaveLength(2);
  });
});

describe("filenames and sizes", () => {
  it("swaps the extension", () => {
    expect(replaceExtension("photo.jpeg", "webp")).toBe("photo.webp");
    expect(replaceExtension("no-extension", "png")).toBe("no-extension.png");
    expect(replaceExtension("my.holiday.photo.PNG", "jpg")).toBe("my.holiday.photo.jpg");
  });

  it("maps formats to extensions", () => {
    expect(extensionFor("image/jpeg")).toBe("jpg");
  });

  it("formats byte sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});
