import { useCallback, useEffect, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { ProLock } from "../../components/pro/ProLock";
import { ToolShell } from "../../components/tool-shell/ToolShell";
import { useIsPro } from "../../stores/appStore";
import { pdfToolkitManifest } from "./manifest";
import {
  NUMBER_POSITIONS,
  ROTATIONS,
  chunkPages,
  parsePageRanges,
  type NumberPosition,
  type PdfMode,
  type Rotation,
} from "./domain";
import {
  addPageNumbers,
  downloadPdf,
  extractPages,
  imagesToPdf,
  mergePdfs,
  readMetadata,
  readPageCount,
  rotatePdf,
  splitPdf,
  writeMetadata,
  type PdfMetadata,
  type PdfResult,
} from "./process";

const MODES: { id: PdfMode; label: string }[] = [
  { id: "merge", label: "Merge" },
  { id: "split", label: "Split" },
  { id: "extract", label: "Extract pages" },
  { id: "rotate", label: "Rotate" },
  { id: "images", label: "Images → PDF" },
  { id: "numbers", label: "Page numbers" },
  { id: "metadata", label: "Metadata" },
];

const PRO_MODES: PdfMode[] = ["numbers", "metadata"];

const formatBytes = (bytes: number): string =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

export function PdfToolkitTool() {
  const isPro = useIsPro();
  const [mode, setMode] = useState<PdfMode>("merge");
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [results, setResults] = useState<PdfResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ranges, setRanges] = useState("1-3");
  const [chunkSize, setChunkSize] = useState(1);
  const [angle, setAngle] = useState<Rotation>(90);
  const [rotateAll, setRotateAll] = useState(true);
  const [numberPosition, setNumberPosition] = useState<NumberPosition>("bottom-center");
  const [startAt, setStartAt] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);

  const wantsImages = mode === "images";
  const locked = PRO_MODES.includes(mode) && !isPro;

  const clearResults = useCallback(() => {
    setResults((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });
  }, []);

  useEffect(() => {
    clearResults();
    setError(null);
    setMetadata(null);
  }, [mode, clearResults]);

  const addFiles = async (list: FileList | null): Promise<void> => {
    if (!list?.length) return;
    setError(null);
    const accepted = [...list].filter((file) =>
      wantsImages ? file.type.startsWith("image/") : file.type === "application/pdf",
    );
    if (accepted.length === 0) {
      setError(wantsImages ? "Choose PNG or JPG images." : "Choose PDF files.");
      return;
    }
    const next = mode === "merge" || wantsImages ? [...files, ...accepted] : accepted.slice(0, 1);
    setFiles(next);
    clearResults();

    const first = next[0];
    if (!wantsImages && first) {
      try {
        const count = await readPageCount(first);
        setPageCount(count);
        if (mode === "metadata") setMetadata(await readMetadata(first));
      } catch {
        setError("That PDF couldn't be opened. It may be password protected.");
        setPageCount(null);
      }
    }
  };

  const removeFile = (index: number): void => {
    setFiles((current) => current.filter((_, i) => i !== index));
    clearResults();
  };

  const run = async (): Promise<void> => {
    const first = files[0];
    if (!first || locked) return;
    setBusy(true);
    setError(null);
    clearResults();
    try {
      if (mode === "merge") {
        if (files.length < 2) {
          setError("Add at least two PDFs to merge.");
          return;
        }
        setResults([await mergePdfs(files)]);
      } else if (mode === "images") {
        setResults([await imagesToPdf(files)]);
      } else if (mode === "split") {
        if (!pageCount) return;
        setResults(await splitPdf(first, chunkPages(pageCount, chunkSize)));
      } else if (mode === "extract") {
        if (!pageCount) return;
        const parsed = parsePageRanges(ranges, pageCount);
        if (!parsed.ok) {
          setError(parsed.error);
          return;
        }
        setResults([await extractPages(first, parsed.value)]);
      } else if (mode === "rotate") {
        if (!pageCount) return;
        let indices: number[] | null = null;
        if (!rotateAll) {
          const parsed = parsePageRanges(ranges, pageCount);
          if (!parsed.ok) {
            setError(parsed.error);
            return;
          }
          indices = parsed.value;
        }
        setResults([await rotatePdf(first, angle, indices)]);
      } else if (mode === "numbers") {
        setResults([await addPageNumbers(first, numberPosition, startAt, fontSize)]);
      } else if (mode === "metadata" && metadata) {
        setResults([await writeMetadata(first, metadata)]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That PDF couldn't be processed.");
    } finally {
      setBusy(false);
    }
  };

  const multiFile = mode === "merge" || wantsImages;

  return (
    <ToolShell tool={pdfToolkitManifest}>
      <main className="pdf-workspace">
        <header className="unified-heading">
          <div>
            <p className="eyebrow">PDF Toolkit.</p>
            <h1>Reshape a PDF without uploading it.</h1>
            <p>
              Merge, split, rotate and rebuild PDFs entirely in your browser — the file never leaves
              your device, which matters more here than in most tools.
            </p>
          </div>
          <div className="mode-switch" role="tablist" aria-label="PDF tool">
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
            <strong>
              {wantsImages ? "Choose images" : multiFile ? "Choose PDFs" : "Choose a PDF"}
            </strong>
            <small>
              {wantsImages
                ? "PNG or JPG — they become one page each, in order"
                : multiFile
                  ? "Two or more PDFs, combined in the order you add them"
                  : pageCount
                    ? `${pageCount} pages loaded`
                    : "One PDF at a time"}
            </small>
          </span>
          <input
            type="file"
            accept={wantsImages ? "image/png,image/jpeg" : "application/pdf"}
            multiple={multiFile}
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>

        {files.length > 0 ? (
          <div className="image-queue">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="image-chip">
                <span className="image-chip-name">{file.name}</span>
                <span className="image-chip-meta">{formatBytes(file.size)}</span>
                <button onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {locked ? (
          <ProLock feature={mode === "numbers" ? "Adding page numbers" : "Editing PDF metadata"} />
        ) : (
          <>
            <div className="image-options">
              {mode === "split" ? (
                <label className="field-label">
                  Pages per file
                  <input
                    type="number"
                    min={1}
                    value={chunkSize}
                    onChange={(event) => setChunkSize(Number(event.target.value) || 1)}
                  />
                </label>
              ) : null}

              {mode === "extract" || (mode === "rotate" && !rotateAll) ? (
                <label className="field-label">
                  Pages
                  <input
                    value={ranges}
                    onChange={(event) => setRanges(event.target.value)}
                    placeholder="1-3, 7, 10-12"
                  />
                </label>
              ) : null}

              {mode === "rotate" ? (
                <>
                  <label className="field-label">
                    Rotate
                    <select
                      value={angle}
                      onChange={(event) => setAngle(Number(event.target.value) as Rotation)}
                    >
                      {ROTATIONS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rotateAll}
                      onChange={() => setRotateAll((value) => !value)}
                    />
                    Every page
                  </label>
                </>
              ) : null}

              {mode === "numbers" ? (
                <>
                  <label className="field-label">
                    Position
                    <select
                      value={numberPosition}
                      onChange={(event) => setNumberPosition(event.target.value as NumberPosition)}
                    >
                      {NUMBER_POSITIONS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-label">
                    Start at
                    <input
                      type="number"
                      min={0}
                      value={startAt}
                      onChange={(event) => setStartAt(Number(event.target.value) || 0)}
                    />
                  </label>
                  <label className="field-label">
                    Size
                    <input
                      type="number"
                      min={6}
                      max={36}
                      value={fontSize}
                      onChange={(event) => setFontSize(Number(event.target.value) || 11)}
                    />
                  </label>
                </>
              ) : null}
            </div>

            {mode === "metadata" && metadata ? (
              <div className="image-options">
                {(["title", "author", "subject", "keywords", "creator"] as const).map((field) => (
                  <label key={field} className="field-label">
                    {field[0]?.toUpperCase()}
                    {field.slice(1)}
                    <input
                      value={metadata[field]}
                      onChange={(event) =>
                        setMetadata({ ...metadata, [field]: event.target.value })
                      }
                    />
                  </label>
                ))}
                <p className="eyebrow">
                  {metadata.pages} pages · produced by {metadata.producer || "unknown"}
                </p>
              </div>
            ) : null}

            <div className="dev-toolbar">
              <button
                className="primary-action"
                onClick={() => void run()}
                disabled={files.length === 0 || busy}
              >
                {busy ? "Working…" : "Process"}
              </button>
              {results.length > 1 ? (
                <button className="secondary-action" onClick={() => results.forEach(downloadPdf)}>
                  <Download size={15} /> Download all
                </button>
              ) : null}
            </div>
          </>
        )}

        {error ? <p className="dev-error">{error}</p> : null}

        {results.length > 0 ? (
          <div className="pdf-results">
            {results.map((item) => (
              <div key={item.id} className="pdf-result">
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.pages} {item.pages === 1 ? "page" : "pages"} · {formatBytes(item.bytes)}
                  </span>
                </div>
                <button className="secondary-action" onClick={() => downloadPdf(item)}>
                  <Download size={14} /> Download
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </main>
    </ToolShell>
  );
}
