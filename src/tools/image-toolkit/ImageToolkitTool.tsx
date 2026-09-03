import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { ProLock } from "../../components/pro/ProLock";
import { ToolShell } from "../../components/tool-shell/ToolShell";
import { useIsPro } from "../../stores/appStore";
import { imageToolkitManifest } from "./manifest";
import {
  FREE_BATCH_LIMIT,
  OUTPUT_FORMATS,
  WATERMARK_POSITIONS,
  formatBytes,
  parseAspectRatio,
  type ImageMode,
  type OutputFormat,
  type ResizeMode,
  type Swatch,
  type WatermarkPosition,
} from "./domain";
import {
  borderImage,
  cropImage,
  downloadProcessed,
  extractColors,
  loadImage,
  reencodeImage,
  resizeImage,
  watermarkImage,
  type LoadedImage,
  type ProcessedImage,
} from "./process";

const MODES: { id: ImageMode; label: string }[] = [
  { id: "resize", label: "Resize" },
  { id: "compress", label: "Compress" },
  { id: "convert", label: "Convert" },
  { id: "crop", label: "Crop" },
  { id: "watermark", label: "Watermark" },
  { id: "border", label: "Border" },
  { id: "colors", label: "Colors" },
];

export function ImageToolkitTool() {
  const isPro = useIsPro();
  const [mode, setMode] = useState<ImageMode>("resize");
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [results, setResults] = useState<ProcessedImage[]>([]);
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(80);
  const [resizeMode, setResizeMode] = useState<ResizeMode>("width");
  const [resizeValue, setResizeValue] = useState(1280);
  const [preventUpscale, setPreventUpscale] = useState(true);
  const [aspect, setAspect] = useState("1:1");
  const [watermarkText, setWatermarkText] = useState("© TinyTools");
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState(70);
  const [watermarkScale, setWatermarkScale] = useState(6);
  const [watermarkColor, setWatermarkColor] = useState("#ffffff");
  const [borderThickness, setBorderThickness] = useState(40);
  const [borderColor, setBorderColor] = useState("#ffffff");

  const limit = isPro ? Infinity : FREE_BATCH_LIMIT;
  const overLimit = images.length > limit;

  // Object URLs from a previous run would leak once new results replace them.
  const clearResults = useCallback(() => {
    setResults((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });
    setSwatches([]);
  }, []);

  useEffect(() => {
    clearResults();
    setError(null);
  }, [mode, clearResults]);

  const addFiles = async (fileList: FileList | null): Promise<void> => {
    if (!fileList?.length) return;
    setError(null);
    const picked = [...fileList].filter((file) => file.type.startsWith("image/"));
    if (picked.length === 0) {
      setError("Those files aren't images.");
      return;
    }
    try {
      const loaded = await Promise.all(picked.map(loadImage));
      setImages((current) => [...current, ...loaded]);
      clearResults();
    } catch {
      setError("One of those files couldn't be opened as an image.");
    }
  };

  const removeImage = (id: string): void => {
    setImages((current) => current.filter((item) => item.id !== id));
    clearResults();
  };

  const run = async (): Promise<void> => {
    if (images.length === 0 || overLimit) return;
    setBusy(true);
    setError(null);
    clearResults();
    try {
      if (mode === "colors") {
        const first = images[0];
        if (first) setSwatches(extractColors(first));
        return;
      }
      const q = quality / 100;
      const processed: ProcessedImage[] = [];
      for (const image of images) {
        if (mode === "resize") {
          processed.push(
            await resizeImage(
              image,
              { mode: resizeMode, value: resizeValue, preventUpscale },
              format,
              q,
            ),
          );
        } else if (mode === "compress" || mode === "convert") {
          processed.push(await reencodeImage(image, format, q));
        } else if (mode === "crop") {
          const ratio = parseAspectRatio(aspect);
          if (!ratio.ok) {
            setError(ratio.error);
            return;
          }
          processed.push(await cropImage(image, ratio.value, format, q));
        } else if (mode === "watermark") {
          processed.push(
            await watermarkImage(
              image,
              {
                text: watermarkText,
                position: watermarkPosition,
                opacity: watermarkOpacity / 100,
                scale: watermarkScale,
                color: watermarkColor,
              },
              format,
              q,
            ),
          );
        } else if (mode === "border") {
          processed.push(await borderImage(image, borderThickness, borderColor, format, q));
        }
      }
      setResults(processed);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Something went wrong processing that image.",
      );
    } finally {
      setBusy(false);
    }
  };

  const totalSaved = useMemo(
    () => results.reduce((sum, item) => sum + (item.originalBytes - item.bytes), 0),
    [results],
  );

  return (
    <ToolShell tool={imageToolkitManifest}>
      <main className="image-workspace">
        <header className="unified-heading">
          <div>
            <p className="eyebrow">Image Toolkit.</p>
            <h1>Fix an image without uploading it.</h1>
            <p>
              Every image is processed by your own browser — nothing is uploaded, and re-encoding
              strips EXIF data like camera model and GPS location along the way.
            </p>
          </div>
          <div className="mode-switch" role="tablist" aria-label="Image tool">
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

        <label className="image-drop">
          <Upload size={18} />
          <span>
            <strong>Choose images</strong>
            <small>
              {isPro
                ? "PNG, JPG, WebP, GIF — as many as you like"
                : `PNG, JPG, WebP, GIF — ${FREE_BATCH_LIMIT} at a time on the free plan`}
            </small>
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>

        {images.length > 0 ? (
          <div className="image-queue">
            {images.map((image) => (
              <div key={image.id} className="image-chip">
                <span className="image-chip-name">{image.file.name}</span>
                <span className="image-chip-meta">
                  {image.width}×{image.height} · {formatBytes(image.file.size)}
                </span>
                <button
                  onClick={() => removeImage(image.id)}
                  aria-label={`Remove ${image.file.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {overLimit ? (
          <ProLock feature="Processing more than one image at a time" />
        ) : (
          <>
            <div className="image-options">
              {mode === "resize" ? (
                <>
                  <label className="field-label">
                    Resize by
                    <select
                      value={resizeMode}
                      onChange={(event) => setResizeMode(event.target.value as ResizeMode)}
                    >
                      <option value="width">Width</option>
                      <option value="height">Height</option>
                      <option value="percent">Percentage</option>
                      <option value="fit">Fit inside a square</option>
                    </select>
                  </label>
                  <label className="field-label">
                    {resizeMode === "percent" ? "Percent" : "Pixels"}
                    <input
                      type="number"
                      min={1}
                      value={resizeValue}
                      onChange={(event) => setResizeValue(Number(event.target.value) || 1)}
                    />
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preventUpscale}
                      onChange={() => setPreventUpscale((value) => !value)}
                    />
                    Don&apos;t enlarge smaller images
                  </label>
                </>
              ) : null}

              {mode === "crop" ? (
                <label className="field-label">
                  Aspect ratio
                  <input
                    value={aspect}
                    onChange={(event) => setAspect(event.target.value)}
                    placeholder="16:9"
                  />
                </label>
              ) : null}

              {mode === "watermark" ? (
                <>
                  <label className="field-label">
                    Text
                    <input
                      value={watermarkText}
                      onChange={(event) => setWatermarkText(event.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    Position
                    <select
                      value={watermarkPosition}
                      onChange={(event) =>
                        setWatermarkPosition(event.target.value as WatermarkPosition)
                      }
                    >
                      {WATERMARK_POSITIONS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-label">
                    Size ({watermarkScale}%)
                    <input
                      type="range"
                      min={2}
                      max={20}
                      value={watermarkScale}
                      onChange={(event) => setWatermarkScale(Number(event.target.value))}
                    />
                  </label>
                  <label className="field-label">
                    Opacity ({watermarkOpacity}%)
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={watermarkOpacity}
                      onChange={(event) => setWatermarkOpacity(Number(event.target.value))}
                    />
                  </label>
                  <label className="field-label">
                    Color
                    <input
                      type="color"
                      value={watermarkColor}
                      onChange={(event) => setWatermarkColor(event.target.value)}
                    />
                  </label>
                </>
              ) : null}

              {mode === "border" ? (
                <>
                  <label className="field-label">
                    Thickness (px)
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={borderThickness}
                      onChange={(event) => setBorderThickness(Number(event.target.value) || 0)}
                    />
                  </label>
                  <label className="field-label">
                    Color
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(event) => setBorderColor(event.target.value)}
                    />
                  </label>
                </>
              ) : null}

              {mode !== "colors" ? (
                <>
                  <label className="field-label">
                    Save as
                    <select
                      value={format}
                      onChange={(event) => setFormat(event.target.value as OutputFormat)}
                    >
                      {OUTPUT_FORMATS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {format !== "image/png" ? (
                    <label className="field-label">
                      Quality ({quality}%)
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={quality}
                        onChange={(event) => setQuality(Number(event.target.value))}
                      />
                    </label>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="dev-toolbar">
              <button
                className="primary-action"
                onClick={() => void run()}
                disabled={images.length === 0 || busy}
              >
                {busy ? "Working…" : mode === "colors" ? "Extract colors" : "Process"}
              </button>
              {results.length > 1 ? (
                <button
                  className="secondary-action"
                  onClick={() => results.forEach(downloadProcessed)}
                >
                  <Download size={15} /> Download all
                </button>
              ) : null}
              {totalSaved > 0 ? <p className="eyebrow">{formatBytes(totalSaved)} saved</p> : null}
            </div>
          </>
        )}

        {error ? <p className="dev-error">{error}</p> : null}

        {swatches.length > 0 ? (
          <div className="swatch-grid">
            {swatches.map((swatch) => (
              <button
                key={swatch.hex}
                className="swatch"
                onClick={() => void navigator.clipboard.writeText(swatch.hex)}
                title="Copy hex"
              >
                <span style={{ background: swatch.hex }} />
                <code>{swatch.hex}</code>
              </button>
            ))}
          </div>
        ) : null}

        {results.length > 0 ? (
          <div className="result-grid">
            {results.map((item) => (
              <figure key={item.id} className="result-card">
                <img src={item.url} alt={item.name} />
                <figcaption>
                  <strong>{item.name}</strong>
                  <span>
                    {item.width}×{item.height} · {formatBytes(item.bytes)}
                    {item.bytes < item.originalBytes
                      ? ` · ${Math.round((1 - item.bytes / item.originalBytes) * 100)}% smaller`
                      : ""}
                  </span>
                  <button className="secondary-action" onClick={() => downloadProcessed(item)}>
                    <Download size={14} /> Download
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </main>
    </ToolShell>
  );
}
