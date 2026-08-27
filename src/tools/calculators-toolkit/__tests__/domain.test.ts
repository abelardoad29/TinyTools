import { describe, expect, it } from "vitest";
import {
  convertLength,
  convertStorage,
  convertTemperature,
  convertWeight,
  decimalToDms,
  decimalToHm,
  decreaseBy,
  diffDates,
  dmsToDecimal,
  heightFromWidth,
  hmToDecimal,
  increaseBy,
  percentChange,
  percentOf,
  simplifyRatio,
  solveDpi,
  solveRuleOfThree,
  textByteSizes,
  whatPercent,
} from "../domain";

describe("unit conversion", () => {
  it("converts length across metric and imperial", () => {
    expect(convertLength(1, "km", "m")).toBe(1000);
    expect(convertLength(1, "mi", "km")).toBeCloseTo(1.609344, 5);
  });

  it("converts weight", () => {
    expect(convertWeight(1, "kg", "g")).toBe(1000);
    expect(convertWeight(1, "lb", "oz")).toBeCloseTo(16, 4);
  });

  it("converts temperature across scales", () => {
    expect(convertTemperature(0, "c", "f")).toBe(32);
    expect(convertTemperature(100, "c", "f")).toBe(212);
    expect(convertTemperature(0, "c", "k")).toBeCloseTo(273.15, 5);
  });
});

describe("storage conversion", () => {
  it("converts using binary base by default", () => {
    expect(convertStorage(1, "kb", "byte")).toBe(1024);
    expect(convertStorage(1, "mb", "kb")).toBe(1024);
  });

  it("converts using decimal base when requested", () => {
    expect(convertStorage(1, "kb", "byte", 1000)).toBe(1000);
  });

  it("converts bits to bytes", () => {
    expect(convertStorage(8, "bit", "byte")).toBe(1);
  });
});

describe("dpi", () => {
  it("solves pixels from dpi and inches", () => {
    expect(solveDpi({ known: "dpi-inches", dpi: 300, inches: 2 })).toEqual({
      dpi: 300,
      inches: 2,
      pixels: 600,
    });
  });

  it("solves dpi from pixels and inches", () => {
    const result = solveDpi({ known: "pixels-inches", pixels: 900, inches: 3 });
    expect(result.dpi).toBe(300);
  });
});

describe("aspect ratio", () => {
  it("simplifies common resolutions", () => {
    expect(simplifyRatio(1920, 1080)).toEqual({ width: 16, height: 9 });
  });

  it("computes height from width for a given ratio", () => {
    expect(heightFromWidth(1920, 16, 9)).toBe(1080);
  });
});

describe("date diff", () => {
  it("computes the day/hour/minute totals and calendar breakdown", () => {
    const result = diffDates("2026-01-01T00:00:00.000Z", "2026-03-15T00:00:00.000Z");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.totalDays).toBe(73);
      expect(result.value.months).toBe(2);
      expect(result.value.days).toBe(14);
    }
  });

  it("rejects invalid dates", () => {
    expect(diffDates("not a date", "2026-01-01").ok).toBe(false);
  });
});

describe("percentage", () => {
  it("computes percent of, what percent, increase, decrease, and change", () => {
    expect(percentOf(20, 50)).toBe(10);
    expect(whatPercent(10, 50)).toBe(20);
    expect(increaseBy(100, 10)).toBeCloseTo(110, 9);
    expect(decreaseBy(100, 10)).toBe(90);
    expect(percentChange(50, 75)).toBe(50);
  });
});

describe("rule of three", () => {
  it("solves a direct proportion", () => {
    expect(solveRuleOfThree(2, 10, 5, "direct")).toEqual({ ok: true, value: 25 });
  });

  it("solves an inverse proportion", () => {
    expect(solveRuleOfThree(4, 6, 8, "inverse")).toEqual({ ok: true, value: 3 });
  });

  it("rejects a zero divisor", () => {
    expect(solveRuleOfThree(0, 10, 5, "direct").ok).toBe(false);
  });
});

describe("time decimal", () => {
  it("converts hours and minutes to decimal and back", () => {
    expect(hmToDecimal(1, 30)).toBe(1.5);
    expect(decimalToHm(1.5)).toEqual({ hours: 1, minutes: 30 });
  });
});

describe("text byte sizes", () => {
  it("counts utf-8 bytes separately from utf-16 code units", () => {
    const sizes = textByteSizes("café");
    expect(sizes.characters).toBe(4);
    expect(sizes.utf8Bytes).toBe(5);
  });
});

describe("coordinates", () => {
  it("round-trips decimal degrees through DMS", () => {
    const dms = decimalToDms(40.7128, "lat");
    expect(dms.direction).toBe("N");
    expect(dms.degrees).toBe(40);
    expect(dmsToDecimal(dms)).toBeCloseTo(40.7128, 3);
  });

  it("uses the southern/western direction for negative values", () => {
    const dms = decimalToDms(-73.935, "lng");
    expect(dms.direction).toBe("W");
    expect(dmsToDecimal(dms)).toBeCloseTo(-73.935, 3);
  });
});
