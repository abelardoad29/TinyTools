import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { ProLock } from "../../components/pro/ProLock";
import { ToolShell } from "../../components/tool-shell/ToolShell";
import { useIsPro } from "../../stores/appStore";
import { qrToolkitManifest } from "./manifest";
import {
  BARCODE_FORMATS,
  buildWifiQrPayload,
  parseBatchLines,
  type BarcodeFormat,
  type ErrorLevel,
  type QrToolMode,
  type WifiEncryption,
} from "./domain";

const MODES: { id: QrToolMode; label: string }[] = [
  { id: "qr", label: "QR" },
  { id: "wifi", label: "WiFi QR" },
  { id: "barcode", label: "Barcode" },
  { id: "batch", label: "Batch / Print sheet" },
];

const triggerDownload = (href: string, filename: string): void => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
};

function useQrCanvas(value: string, size: number, errorLevel: ErrorLevel) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!value) {
      setError(null);
      return;
    }
    let active = true;
    QRCode.toCanvas(canvas, value, { width: size, errorCorrectionLevel: errorLevel, margin: 1 })
      .then(() => {
        if (active) setError(null);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : "Couldn't generate this QR code.");
      });
    return () => {
      active = false;
    };
  }, [value, size, errorLevel]);

  return { ref, error };
}

export function QrToolkitTool() {
  const isPro = useIsPro();
  const [mode, setMode] = useState<QrToolMode>("qr");
  return (
    <ToolShell tool={qrToolkitManifest}>
      <main className="qr-workspace">
        <header className="unified-heading">
          <div>
            <p className="eyebrow">QR &amp; Barcode Toolkit.</p>
            <h1>Codes ready to scan or print.</h1>
            <p>QR, WiFi QR, barcodes, and printable batches — generated in your browser.</p>
          </div>
          <div className="mode-switch" role="tablist" aria-label="QR tool">
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
        <div className="qr-panel">
          {mode === "qr" ? <QrView /> : null}
          {mode === "wifi" ? <WifiQrView /> : null}
          {mode === "barcode" ? <BarcodeView /> : null}
          {mode === "batch" ? (
            isPro ? (
              <BatchView />
            ) : (
              <ProLock feature="Batch generation and print sheets" />
            )
          ) : null}
        </div>
      </main>
    </ToolShell>
  );
}

const ERROR_LEVELS: { id: ErrorLevel; label: string }[] = [
  { id: "L", label: "Low" },
  { id: "M", label: "Medium" },
  { id: "Q", label: "Quartile" },
  { id: "H", label: "High" },
];

function QrView() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");
  const { ref, error } = useQrCanvas(text, size, errorLevel);

  const downloadPng = (): void => {
    if (!ref.current) return;
    triggerDownload(ref.current.toDataURL("image/png"), "qr-code.png");
  };

  const downloadSvg = async (): Promise<void> => {
    if (!text) return;
    try {
      const svg = await QRCode.toString(text, {
        type: "svg",
        errorCorrectionLevel: errorLevel,
        margin: 1,
      });
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      triggerDownload(url, "qr-code.svg");
      URL.revokeObjectURL(url);
    } catch {
      // The canvas preview already surfaces generation errors above.
    }
  };

  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder="Text or URL"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="calc-row">
        <label className="field-label">
          Size
          <input
            type="number"
            min={128}
            max={1024}
            step={32}
            value={size}
            onChange={(event) => setSize(Math.max(128, Number(event.target.value) || 256))}
          />
        </label>
        <label className="field-label">
          Error correction
          <select
            value={errorLevel}
            onChange={(event) => setErrorLevel(event.target.value as ErrorLevel)}
          >
            {ERROR_LEVELS.map((level) => (
              <option key={level.id} value={level.id}>
                {level.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? <p className="dev-error">{error}</p> : null}
      <div className="qr-preview">
        <canvas ref={ref} />
      </div>
      <div className="dev-toolbar">
        <button className="secondary-action" onClick={downloadPng} disabled={!text || !!error}>
          Download PNG
        </button>
        <button
          className="secondary-action"
          onClick={() => void downloadSvg()}
          disabled={!text || !!error}
        >
          Download SVG
        </button>
      </div>
    </section>
  );
}

function WifiQrView() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<WifiEncryption>("WPA");
  const [hidden, setHidden] = useState(false);
  const payload = useMemo(
    () => (ssid ? buildWifiQrPayload({ ssid, password, encryption, hidden }) : ""),
    [ssid, password, encryption, hidden],
  );
  const { ref, error } = useQrCanvas(payload, 240, "M");

  const downloadPng = (): void => {
    if (!ref.current) return;
    triggerDownload(ref.current.toDataURL("image/png"), "wifi-qr.png");
  };

  return (
    <section>
      <div className="calc-row">
        <label className="field-label">
          Network name (SSID)
          <input value={ssid} onChange={(event) => setSsid(event.target.value)} />
        </label>
        <label className="field-label">
          Security
          <select
            value={encryption}
            onChange={(event) => setEncryption(event.target.value as WifiEncryption)}
          >
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">None</option>
          </select>
        </label>
      </div>
      {encryption !== "nopass" ? (
        <label className="field-label">
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
      ) : null}
      <div className="option-row">
        <label>
          <input type="checkbox" checked={hidden} onChange={() => setHidden((value) => !value)} />
          Hidden network
        </label>
      </div>
      {error ? <p className="dev-error">{error}</p> : null}
      <div className="qr-preview">
        <canvas ref={ref} />
      </div>
      <div className="dev-toolbar">
        <button className="secondary-action" onClick={downloadPng} disabled={!ssid || !!error}>
          Download PNG
        </button>
      </div>
    </section>
  );
}

function BarcodeView() {
  const [value, setValue] = useState("");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (!value) {
      svg.replaceChildren();
      setError(null);
      return;
    }
    try {
      JsBarcode(svg, value, { format, displayValue: true, margin: 10 });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't generate this barcode.");
    }
  }, [value, format]);

  const downloadSvg = (): void => {
    const svg = svgRef.current;
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
    triggerDownload(url, "barcode.svg");
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div className="calc-row">
        <label className="field-label">
          Value
          <input value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
        <label className="field-label">
          Format
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as BarcodeFormat)}
          >
            {BARCODE_FORMATS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? <p className="dev-error">{error}</p> : null}
      <div className="qr-preview">
        <svg ref={svgRef} />
      </div>
      <div className="dev-toolbar">
        <button className="secondary-action" onClick={downloadSvg} disabled={!value || !!error}>
          Download SVG
        </button>
      </div>
    </section>
  );
}

function BatchQrItem({ value }: { value: string }) {
  const { ref, error } = useQrCanvas(value, 160, "M");
  return (
    <figure className="qr-batch-item">
      <canvas ref={ref} />
      <figcaption>{error ? "Invalid value" : value}</figcaption>
    </figure>
  );
}

function BatchView() {
  const [input, setInput] = useState("");
  const lines = useMemo(() => parseBatchLines(input), [input]);

  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder={"One value per line\nhttps://example.com/1\nhttps://example.com/2"}
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="dev-toolbar">
        <p className="eyebrow">
          {lines.length} code{lines.length === 1 ? "" : "s"} — up to 100 per batch
        </p>
        <button
          className="secondary-action"
          onClick={() => window.print()}
          disabled={lines.length === 0}
        >
          Print sheet
        </button>
      </div>
      {lines.length > 0 ? (
        <div className="qr-batch-grid">
          {lines.map((line, index) => (
            <BatchQrItem key={`${line}-${index}`} value={line} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Nothing to generate yet.</p>
          <span>Paste one value per line — URLs, codes, anything.</span>
        </div>
      )}
    </section>
  );
}
