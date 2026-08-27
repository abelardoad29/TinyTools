import { useEffect, useMemo, useState } from "react";
import { ToolShell } from "../../components/tool-shell/ToolShell";
import { calculatorsToolkitManifest } from "./manifest";
import {
  convertLength,
  convertStorage,
  convertTemperature,
  convertVolume,
  convertWeight,
  decimalToDms,
  decimalToHm,
  decreaseBy,
  diffDates,
  formatDms,
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
  type CalcMode,
  type CoordinateAxis,
  type DpiKnown,
  type LengthUnit,
  type ProportionKind,
  type StorageBase,
  type StorageUnit,
  type TemperatureUnit,
  type VolumeUnit,
  type WeightUnit,
} from "./domain";

const MODES: { id: CalcMode; label: string }[] = [
  { id: "unit", label: "Unit" },
  { id: "storage", label: "Storage" },
  { id: "dpi", label: "DPI" },
  { id: "aspect", label: "Aspect" },
  { id: "date-diff", label: "Date diff" },
  { id: "percentage", label: "Percentage" },
  { id: "rule-of-three", label: "Rule of 3" },
  { id: "time-decimal", label: "Time decimal" },
  { id: "bytes-text", label: "Bytes of text" },
  { id: "coordinates", label: "Coordinates" },
];

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 1e6) / 1e6;
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 6 });
};

export function CalculatorsToolkitTool() {
  const [mode, setMode] = useState<CalcMode>("unit");
  return (
    <ToolShell tool={calculatorsToolkitManifest}>
      <main className="calc-workspace">
        <header className="unified-heading">
          <div>
            <p className="eyebrow">Calculators Toolkit.</p>
            <h1>Ten small calculators, one place.</h1>
            <p>Units, storage, DPI, aspect ratio, dates, percentages, and more.</p>
          </div>
          <div className="mode-switch" role="tablist" aria-label="Calculator">
            {MODES.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={mode === item.id}
                className={mode === item.id ? "active" : ""}
                onClick={() => setMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>
        <div className="calc-panel">
          {mode === "unit" ? <UnitView /> : null}
          {mode === "storage" ? <StorageView /> : null}
          {mode === "dpi" ? <DpiView /> : null}
          {mode === "aspect" ? <AspectView /> : null}
          {mode === "date-diff" ? <DateDiffView /> : null}
          {mode === "percentage" ? <PercentageView /> : null}
          {mode === "rule-of-three" ? <RuleOfThreeView /> : null}
          {mode === "time-decimal" ? <TimeDecimalView /> : null}
          {mode === "bytes-text" ? <BytesTextView /> : null}
          {mode === "coordinates" ? <CoordinatesView /> : null}
        </div>
      </main>
    </ToolShell>
  );
}

type UnitCategory = "length" | "weight" | "volume" | "temperature";

const UNIT_OPTIONS: Record<UnitCategory, string[]> = {
  length: ["mm", "cm", "m", "km", "in", "ft", "yd", "mi"],
  weight: ["mg", "g", "kg", "oz", "lb"],
  volume: ["ml", "l", "tsp", "tbsp", "cup", "gal"],
  temperature: ["c", "f", "k"],
};

const UNIT_CATEGORY_LABELS: Record<UnitCategory, string> = {
  length: "Length",
  weight: "Weight",
  volume: "Volume",
  temperature: "Temperature",
};

function UnitView() {
  const [category, setCategory] = useState<UnitCategory>("length");
  const units = UNIT_OPTIONS[category];
  const [from, setFrom] = useState(units[0] ?? "");
  const [to, setTo] = useState(units[1] ?? units[0] ?? "");
  const [value, setValue] = useState(1);

  useEffect(() => {
    const nextUnits = UNIT_OPTIONS[category];
    setFrom(nextUnits[0] ?? "");
    setTo(nextUnits[1] ?? nextUnits[0] ?? "");
  }, [category]);

  const result = useMemo(() => {
    if (!from || !to) return 0;
    if (category === "length") return convertLength(value, from as LengthUnit, to as LengthUnit);
    if (category === "weight") return convertWeight(value, from as WeightUnit, to as WeightUnit);
    if (category === "volume") return convertVolume(value, from as VolumeUnit, to as VolumeUnit);
    return convertTemperature(value, from as TemperatureUnit, to as TemperatureUnit);
  }, [category, value, from, to]);

  return (
    <section>
      <div className="mode-switch calc-row">
        {(Object.keys(UNIT_OPTIONS) as UnitCategory[]).map((item) => (
          <button
            key={item}
            className={category === item ? "active" : ""}
            onClick={() => setCategory(item)}
          >
            {UNIT_CATEGORY_LABELS[item]}
          </button>
        ))}
      </div>
      <div className="calc-row">
        <label className="field-label">
          Value
          <input
            type="number"
            value={value}
            onChange={(event) => setValue(Number(event.target.value) || 0)}
          />
        </label>
        <label className="field-label">
          From
          <select value={from} onChange={(event) => setFrom(event.target.value)}>
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          To
          <select value={to} onChange={(event) => setTo(event.target.value)}>
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="calc-result">
        <strong>{formatNumber(result)}</strong>
        <span>{to}</span>
      </div>
    </section>
  );
}

const STORAGE_UNITS: { id: StorageUnit; label: string }[] = [
  { id: "bit", label: "bit" },
  { id: "byte", label: "byte" },
  { id: "kb", label: "KB" },
  { id: "mb", label: "MB" },
  { id: "gb", label: "GB" },
  { id: "tb", label: "TB" },
  { id: "pb", label: "PB" },
];

function StorageView() {
  const [value, setValue] = useState(1);
  const [from, setFrom] = useState<StorageUnit>("gb");
  const [to, setTo] = useState<StorageUnit>("mb");
  const [base, setBase] = useState<StorageBase>(1024);
  const result = useMemo(() => convertStorage(value, from, to, base), [value, from, to, base]);

  return (
    <section>
      <div className="mode-switch calc-row">
        <button className={base === 1024 ? "active" : ""} onClick={() => setBase(1024)}>
          Binary (1024)
        </button>
        <button className={base === 1000 ? "active" : ""} onClick={() => setBase(1000)}>
          Decimal (1000)
        </button>
      </div>
      <div className="calc-row">
        <label className="field-label">
          Value
          <input
            type="number"
            value={value}
            onChange={(event) => setValue(Number(event.target.value) || 0)}
          />
        </label>
        <label className="field-label">
          From
          <select value={from} onChange={(event) => setFrom(event.target.value as StorageUnit)}>
            {STORAGE_UNITS.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          To
          <select value={to} onChange={(event) => setTo(event.target.value as StorageUnit)}>
            {STORAGE_UNITS.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="calc-result">
        <strong>{formatNumber(result)}</strong>
        <span>{STORAGE_UNITS.find((unit) => unit.id === to)?.label}</span>
      </div>
    </section>
  );
}

function DpiView() {
  const [known, setKnown] = useState<DpiKnown>("dpi-inches");
  const [dpi, setDpi] = useState(300);
  const [inches, setInches] = useState(4);
  const [pixels, setPixels] = useState(1200);

  const result = useMemo(() => {
    if (known === "dpi-inches") return solveDpi({ known, dpi, inches });
    if (known === "pixels-inches") return solveDpi({ known, pixels, inches });
    return solveDpi({ known, pixels, dpi });
  }, [known, dpi, inches, pixels]);

  return (
    <section>
      <div className="mode-switch calc-row">
        <button
          className={known === "dpi-inches" ? "active" : ""}
          onClick={() => setKnown("dpi-inches")}
        >
          DPI + inches
        </button>
        <button
          className={known === "pixels-inches" ? "active" : ""}
          onClick={() => setKnown("pixels-inches")}
        >
          Pixels + inches
        </button>
        <button
          className={known === "pixels-dpi" ? "active" : ""}
          onClick={() => setKnown("pixels-dpi")}
        >
          Pixels + DPI
        </button>
      </div>
      <div className="calc-row">
        {known !== "pixels-dpi" ? (
          <label className="field-label">
            Inches
            <input
              type="number"
              value={inches}
              onChange={(event) => setInches(Number(event.target.value) || 0)}
            />
          </label>
        ) : null}
        {known !== "pixels-inches" ? (
          <label className="field-label">
            DPI
            <input
              type="number"
              value={dpi}
              onChange={(event) => setDpi(Number(event.target.value) || 0)}
            />
          </label>
        ) : null}
        {known !== "dpi-inches" ? (
          <label className="field-label">
            Pixels
            <input
              type="number"
              value={pixels}
              onChange={(event) => setPixels(Number(event.target.value) || 0)}
            />
          </label>
        ) : null}
      </div>
      <div className="calc-breakdown">
        <div>
          <strong>{formatNumber(result.pixels)}</strong>
          <span>Pixels</span>
        </div>
        <div>
          <strong>{formatNumber(result.inches)}</strong>
          <span>Inches</span>
        </div>
        <div>
          <strong>{formatNumber(result.dpi)}</strong>
          <span>DPI</span>
        </div>
      </div>
    </section>
  );
}

function AspectView() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const ratio = useMemo(() => simplifyRatio(width, height), [width, height]);

  const [targetWidth, setTargetWidth] = useState(1280);
  const computedHeight = useMemo(
    () => heightFromWidth(targetWidth, ratio.width, ratio.height),
    [targetWidth, ratio],
  );

  return (
    <section>
      <div className="calc-row">
        <label className="field-label">
          Width
          <input
            type="number"
            value={width}
            onChange={(event) => setWidth(Number(event.target.value) || 0)}
          />
        </label>
        <label className="field-label">
          Height
          <input
            type="number"
            value={height}
            onChange={(event) => setHeight(Number(event.target.value) || 0)}
          />
        </label>
      </div>
      <div className="calc-result">
        <strong>
          {ratio.width}:{ratio.height}
        </strong>
        <span>Simplified ratio</span>
      </div>
      <div className="calc-row">
        <label className="field-label">
          New width
          <input
            type="number"
            value={targetWidth}
            onChange={(event) => setTargetWidth(Number(event.target.value) || 0)}
          />
        </label>
      </div>
      <div className="calc-result">
        <strong>{formatNumber(computedHeight)}</strong>
        <span>Matching height</span>
      </div>
    </section>
  );
}

function DateDiffView() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const result = useMemo(() => (from && to ? diffDates(from, to) : null), [from, to]);

  return (
    <section>
      <div className="calc-row">
        <label className="field-label">
          From
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="field-label">
          To
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
      </div>
      {result && !result.ok ? <p className="dev-error">{result.error}</p> : null}
      {result?.ok ? (
        <div className="calc-breakdown">
          <div>
            <strong>
              {result.value.years}y {result.value.months}m {result.value.days}d
            </strong>
            <span>Calendar</span>
          </div>
          <div>
            <strong>{result.value.totalDays}</strong>
            <span>Total days</span>
          </div>
          <div>
            <strong>{result.value.totalHours}</strong>
            <span>Total hours</span>
          </div>
          <div>
            <strong>{result.value.totalMinutes}</strong>
            <span>Total minutes</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type PercentOp = "of" | "what-percent" | "increase" | "decrease" | "change";
const PERCENT_OPS: { id: PercentOp; label: string }[] = [
  { id: "of", label: "X% of Y" },
  { id: "what-percent", label: "X is what % of Y" },
  { id: "increase", label: "Increase Y by X%" },
  { id: "decrease", label: "Decrease Y by X%" },
  { id: "change", label: "Change from X to Y" },
];

function PercentageView() {
  const [op, setOp] = useState<PercentOp>("of");
  const [x, setX] = useState(20);
  const [y, setY] = useState(50);

  const result = useMemo(() => {
    switch (op) {
      case "of":
        return percentOf(x, y);
      case "what-percent":
        return whatPercent(x, y);
      case "increase":
        return increaseBy(y, x);
      case "decrease":
        return decreaseBy(y, x);
      case "change":
        return percentChange(x, y);
    }
  }, [op, x, y]);

  return (
    <section>
      <div className="mode-switch calc-row">
        {PERCENT_OPS.map((item) => (
          <button
            key={item.id}
            className={op === item.id ? "active" : ""}
            onClick={() => setOp(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="calc-row">
        <label className="field-label">
          X
          <input
            type="number"
            value={x}
            onChange={(event) => setX(Number(event.target.value) || 0)}
          />
        </label>
        <label className="field-label">
          Y
          <input
            type="number"
            value={y}
            onChange={(event) => setY(Number(event.target.value) || 0)}
          />
        </label>
      </div>
      <div className="calc-result">
        <strong>
          {formatNumber(result)}
          {op === "what-percent" || op === "change" ? "%" : ""}
        </strong>
      </div>
    </section>
  );
}

function RuleOfThreeView() {
  const [kind, setKind] = useState<ProportionKind>("direct");
  const [a, setA] = useState(2);
  const [b, setB] = useState(10);
  const [c, setC] = useState(5);
  const result = useMemo(() => solveRuleOfThree(a, b, c, kind), [a, b, c, kind]);

  return (
    <section>
      <div className="mode-switch calc-row">
        <button className={kind === "direct" ? "active" : ""} onClick={() => setKind("direct")}>
          Direct
        </button>
        <button className={kind === "inverse" ? "active" : ""} onClick={() => setKind("inverse")}>
          Inverse
        </button>
      </div>
      <div className="calc-row">
        <label className="field-label">
          A
          <input
            type="number"
            value={a}
            onChange={(event) => setA(Number(event.target.value) || 0)}
          />
        </label>
        <label className="field-label">
          B
          <input
            type="number"
            value={b}
            onChange={(event) => setB(Number(event.target.value) || 0)}
          />
        </label>
        <label className="field-label">
          C
          <input
            type="number"
            value={c}
            onChange={(event) => setC(Number(event.target.value) || 0)}
          />
        </label>
      </div>
      <p className="eyebrow">A is to B as C is to X</p>
      {!result.ok ? (
        <p className="dev-error">{result.error}</p>
      ) : (
        <div className="calc-result">
          <strong>{formatNumber(result.value)}</strong>
          <span>X</span>
        </div>
      )}
    </section>
  );
}

function TimeDecimalView() {
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(30);
  const [decimal, setDecimal] = useState(1.5);
  const converted = decimalToHm(decimal);

  return (
    <section className="dev-grid">
      <div>
        <p className="eyebrow">hh:mm to decimal</p>
        <div className="calc-row">
          <label className="field-label">
            Hours
            <input
              type="number"
              value={hours}
              onChange={(event) => setHours(Number(event.target.value) || 0)}
            />
          </label>
          <label className="field-label">
            Minutes
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value) || 0)}
            />
          </label>
        </div>
        <div className="calc-result">
          <strong>{formatNumber(hmToDecimal(hours, minutes))}</strong>
          <span>Decimal hours</span>
        </div>
      </div>
      <div>
        <p className="eyebrow">Decimal to hh:mm</p>
        <label className="field-label">
          Decimal hours
          <input
            type="number"
            value={decimal}
            onChange={(event) => setDecimal(Number(event.target.value) || 0)}
          />
        </label>
        <div className="calc-result">
          <strong>
            {String(converted.hours).padStart(2, "0")}:{String(converted.minutes).padStart(2, "0")}
          </strong>
          <span>hh:mm</span>
        </div>
      </div>
    </section>
  );
}

function BytesTextView() {
  const [input, setInput] = useState("");
  const sizes = useMemo(() => textByteSizes(input), [input]);
  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder="Type or paste text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="calc-breakdown">
        <div>
          <strong>{sizes.characters}</strong>
          <span>Characters</span>
        </div>
        <div>
          <strong>{sizes.utf16CodeUnits}</strong>
          <span>UTF-16 units</span>
        </div>
        <div>
          <strong>{sizes.utf8Bytes}</strong>
          <span>UTF-8 bytes</span>
        </div>
      </div>
    </section>
  );
}

function CoordinatesView() {
  const [axis, setAxis] = useState<CoordinateAxis>("lat");
  const [decimal, setDecimal] = useState(40.7128);
  const dms = useMemo(() => decimalToDms(decimal, axis), [decimal, axis]);

  return (
    <section>
      <div className="mode-switch calc-row">
        <button className={axis === "lat" ? "active" : ""} onClick={() => setAxis("lat")}>
          Latitude
        </button>
        <button className={axis === "lng" ? "active" : ""} onClick={() => setAxis("lng")}>
          Longitude
        </button>
      </div>
      <label className="field-label">
        Decimal degrees
        <input
          type="number"
          value={decimal}
          onChange={(event) => setDecimal(Number(event.target.value) || 0)}
        />
      </label>
      <div className="calc-result">
        <strong>{formatDms(dms)}</strong>
        <span>DMS</span>
      </div>
    </section>
  );
}
