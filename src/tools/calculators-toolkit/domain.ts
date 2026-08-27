import type { Result } from "../../lib/result";

export type { Result } from "../../lib/result";

export type CalcMode =
  | "unit"
  | "storage"
  | "dpi"
  | "aspect"
  | "date-diff"
  | "percentage"
  | "rule-of-three"
  | "time-decimal"
  | "bytes-text"
  | "coordinates";

export type LengthUnit = "mm" | "cm" | "m" | "km" | "in" | "ft" | "yd" | "mi";
export type WeightUnit = "mg" | "g" | "kg" | "oz" | "lb";
export type VolumeUnit = "ml" | "l" | "tsp" | "tbsp" | "cup" | "gal";
export type TemperatureUnit = "c" | "f" | "k";

export const LENGTH_TO_METERS: Record<LengthUnit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
};

export const WEIGHT_TO_GRAMS: Record<WeightUnit, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
};

export const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  gal: 3785.41,
};

export const convertLength = (value: number, from: LengthUnit, to: LengthUnit): number =>
  (value * LENGTH_TO_METERS[from]) / LENGTH_TO_METERS[to];

export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number =>
  (value * WEIGHT_TO_GRAMS[from]) / WEIGHT_TO_GRAMS[to];

export const convertVolume = (value: number, from: VolumeUnit, to: VolumeUnit): number =>
  (value * VOLUME_TO_ML[from]) / VOLUME_TO_ML[to];

export const convertTemperature = (
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit,
): number => {
  const celsius = from === "c" ? value : from === "f" ? ((value - 32) * 5) / 9 : value - 273.15;
  if (to === "c") return celsius;
  if (to === "f") return (celsius * 9) / 5 + 32;
  return celsius + 273.15;
};

export type StorageUnit = "bit" | "byte" | "kb" | "mb" | "gb" | "tb" | "pb";
export type StorageBase = 1000 | 1024;

const BYTE_EXPONENT: Record<Exclude<StorageUnit, "bit">, number> = {
  byte: 0,
  kb: 1,
  mb: 2,
  gb: 3,
  tb: 4,
  pb: 5,
};

export const convertStorage = (
  value: number,
  from: StorageUnit,
  to: StorageUnit,
  base: StorageBase = 1024,
): number => {
  const bits = from === "bit" ? value : value * 8 * base ** BYTE_EXPONENT[from];
  return to === "bit" ? bits : bits / (8 * base ** BYTE_EXPONENT[to]);
};

export type DpiKnown = "dpi-inches" | "pixels-inches" | "pixels-dpi";
export type DpiInput =
  | { known: "dpi-inches"; dpi: number; inches: number }
  | { known: "pixels-inches"; pixels: number; inches: number }
  | { known: "pixels-dpi"; pixels: number; dpi: number };

export const solveDpi = (input: DpiInput): { pixels: number; inches: number; dpi: number } => {
  switch (input.known) {
    case "dpi-inches":
      return { dpi: input.dpi, inches: input.inches, pixels: input.dpi * input.inches };
    case "pixels-inches":
      return {
        pixels: input.pixels,
        inches: input.inches,
        dpi: input.inches === 0 ? 0 : input.pixels / input.inches,
      };
    case "pixels-dpi":
      return {
        pixels: input.pixels,
        dpi: input.dpi,
        inches: input.dpi === 0 ? 0 : input.pixels / input.dpi,
      };
  }
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export const simplifyRatio = (width: number, height: number): { width: number; height: number } => {
  const roundedWidth = Math.round(width);
  const roundedHeight = Math.round(height);
  if (roundedWidth <= 0 || roundedHeight <= 0) return { width: 0, height: 0 };
  const divisor = gcd(roundedWidth, roundedHeight);
  return divisor === 0
    ? { width: 0, height: 0 }
    : { width: roundedWidth / divisor, height: roundedHeight / divisor };
};

export const heightFromWidth = (width: number, ratioWidth: number, ratioHeight: number): number =>
  ratioWidth === 0 ? 0 : (width * ratioHeight) / ratioWidth;

export const widthFromHeight = (height: number, ratioWidth: number, ratioHeight: number): number =>
  ratioHeight === 0 ? 0 : (height * ratioWidth) / ratioHeight;

export type DateDiffResult = {
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  years: number;
  months: number;
  days: number;
};

export const diffDates = (fromIso: string, toIso: string): Result<DateDiffResult> => {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()))
    return { ok: false, error: "Enter two valid dates." };
  const ms = Math.abs(to.getTime() - from.getTime());
  const totalDays = Math.floor(ms / 86_400_000);
  const totalHours = Math.floor(ms / 3_600_000);
  const totalMinutes = Math.floor(ms / 60_000);

  const [earlier, later] = from.getTime() <= to.getTime() ? [from, to] : [to, from];
  let years = later.getUTCFullYear() - earlier.getUTCFullYear();
  let months = later.getUTCMonth() - earlier.getUTCMonth();
  let days = later.getUTCDate() - earlier.getUTCDate();
  if (days < 0) {
    months -= 1;
    const daysInPreviousMonth = new Date(
      Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), 0),
    ).getUTCDate();
    days += daysInPreviousMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { ok: true, value: { totalDays, totalHours, totalMinutes, years, months, days } };
};

export const percentOf = (percent: number, value: number): number => (percent / 100) * value;

export const whatPercent = (part: number, whole: number): number =>
  whole === 0 ? 0 : (part / whole) * 100;

export const increaseBy = (value: number, percent: number): number => value * (1 + percent / 100);

export const decreaseBy = (value: number, percent: number): number => value * (1 - percent / 100);

export const percentChange = (from: number, to: number): number =>
  from === 0 ? 0 : ((to - from) / Math.abs(from)) * 100;

export type ProportionKind = "direct" | "inverse";

export const solveRuleOfThree = (
  a: number,
  b: number,
  c: number,
  kind: ProportionKind,
): Result<number> => {
  if (kind === "direct") {
    if (a === 0) return { ok: false, error: "The first value can't be zero." };
    return { ok: true, value: (b * c) / a };
  }
  if (c === 0) return { ok: false, error: "The third value can't be zero." };
  return { ok: true, value: (a * b) / c };
};

export const hmToDecimal = (hours: number, minutes: number): number => hours + minutes / 60;

export const decimalToHm = (decimal: number): { hours: number; minutes: number } => {
  const totalMinutes = Math.round(decimal * 60);
  return { hours: Math.trunc(totalMinutes / 60), minutes: totalMinutes % 60 };
};

export type TextByteSizes = { utf8Bytes: number; utf16CodeUnits: number; characters: number };

export const textByteSizes = (input: string): TextByteSizes => ({
  utf8Bytes: new TextEncoder().encode(input).length,
  utf16CodeUnits: input.length,
  characters: Array.from(input).length,
});

export type CoordinateAxis = "lat" | "lng";
export type CoordinateDirection = "N" | "S" | "E" | "W";
export type DmsCoordinate = {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: CoordinateDirection;
};

export const decimalToDms = (value: number, axis: CoordinateAxis): DmsCoordinate => {
  const direction: CoordinateDirection =
    axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutesFull = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = (minutesFull - minutes) * 60;
  return { degrees, minutes, seconds, direction };
};

export const dmsToDecimal = (dms: DmsCoordinate): number => {
  const magnitude = dms.degrees + dms.minutes / 60 + dms.seconds / 3600;
  return dms.direction === "S" || dms.direction === "W" ? -magnitude : magnitude;
};

export const formatDms = (dms: DmsCoordinate): string =>
  `${dms.degrees}° ${dms.minutes}' ${dms.seconds.toFixed(2)}" ${dms.direction}`;
