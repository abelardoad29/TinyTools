import { useEffect, useMemo, useState } from "react";
import { Check, Copy, RefreshCw, Save, Trash2 } from "lucide-react";
import { ProLock } from "../../components/pro/ProLock";
import { ToolShell } from "../../components/tool-shell/ToolShell";
import { storage } from "../../core/storage/storage";
import { useIsPro } from "../../stores/appStore";
import { textToolkitManifest } from "./manifest";
import {
  applyLineOperation,
  cleanText,
  convertCase,
  countText,
  createClipboardItem,
  diffLines,
  findReplace,
  generateLoremParagraphs,
  slugify,
  type CaseMode,
  type CleanOptions,
  type ClipboardItem,
  type LineOperation,
  type SlugSeparator,
  type TextMode,
} from "./domain";

const MODES: { id: TextMode; label: string }[] = [
  { id: "case", label: "Case" },
  { id: "count", label: "Count" },
  { id: "clean", label: "Clean" },
  { id: "clipboard", label: "Clipboard" },
  { id: "find-replace", label: "Find/Replace" },
  { id: "lines", label: "Lines" },
  { id: "slug", label: "Slug" },
  { id: "lorem", label: "Lorem" },
  { id: "diff", label: "Diff" },
];

const CLIPBOARD_STORAGE_KEY = "tool.text-toolkit.clipboard.v1";

export function TextToolkitTool() {
  const isPro = useIsPro();
  const [mode, setMode] = useState<TextMode>("case");
  return (
    <ToolShell tool={textToolkitManifest}>
      <main className="text-workspace">
        <header className="unified-heading">
          <div>
            <p className="eyebrow">Text Toolkit.</p>
            <h1>Every everyday text task.</h1>
            <p>Case, cleanup, counting, find/replace, lines, slugs, lorem ipsum, and diff.</p>
          </div>
          <div className="mode-switch" role="tablist" aria-label="Text tool">
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
        <div className="text-panel">
          {mode === "case" ? <CaseView /> : null}
          {mode === "count" ? <CountView /> : null}
          {mode === "clean" ? <CleanView /> : null}
          {mode === "clipboard" ? (
            isPro ? (
              <ClipboardView />
            ) : (
              <ProLock feature="The clipboard shelf" />
            )
          ) : null}
          {mode === "find-replace" ? <FindReplaceView /> : null}
          {mode === "lines" ? <LinesView /> : null}
          {mode === "slug" ? <SlugView /> : null}
          {mode === "lorem" ? <LoremView /> : null}
          {mode === "diff" ? <DiffView /> : null}
        </div>
      </main>
    </ToolShell>
  );
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard access can be denied by the browser — nothing to recover here.
    }
  };
  return (
    <button className="dev-copy" type="button" onClick={() => void copy()} disabled={!value}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

const CASE_OPTIONS: { id: CaseMode; label: string }[] = [
  { id: "upper", label: "UPPERCASE" },
  { id: "lower", label: "lowercase" },
  { id: "title", label: "Title Case" },
  { id: "sentence", label: "Sentence case" },
  { id: "camel", label: "camelCase" },
  { id: "pascal", label: "PascalCase" },
  { id: "snake", label: "snake_case" },
  { id: "kebab", label: "kebab-case" },
  { id: "constant", label: "CONSTANT_CASE" },
];

function CaseView() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder="Type or paste text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="case-grid">
        {CASE_OPTIONS.map((option) => (
          <button key={option.id} onClick={() => setOutput(convertCase(input, option.id))}>
            {option.label}
          </button>
        ))}
      </div>
      {output ? (
        <>
          <div className="dev-toolbar">
            <CopyButton value={output} />
          </div>
          <textarea className="dev-textarea output" readOnly value={output} />
        </>
      ) : null}
    </section>
  );
}

function CountView() {
  const [input, setInput] = useState("");
  const stats = useMemo(() => countText(input), [input]);
  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder="Type or paste text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="stat-grid">
        <div>
          <strong>{stats.characters}</strong>
          <span>Characters</span>
        </div>
        <div>
          <strong>{stats.charactersNoSpaces}</strong>
          <span>No spaces</span>
        </div>
        <div>
          <strong>{stats.words}</strong>
          <span>Words</span>
        </div>
        <div>
          <strong>{stats.lines}</strong>
          <span>Lines</span>
        </div>
        <div>
          <strong>{stats.paragraphs}</strong>
          <span>Paragraphs</span>
        </div>
      </div>
    </section>
  );
}

function CleanView() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<CleanOptions>({
    removeInvisible: true,
    trimLines: true,
    collapseSpaces: true,
    collapseBlankLines: true,
  });
  const output = useMemo(() => cleanText(input, options), [input, options]);
  const toggle = (key: keyof CleanOptions): void =>
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder="Type or paste text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="option-row">
        <label>
          <input
            type="checkbox"
            checked={options.removeInvisible}
            onChange={() => toggle("removeInvisible")}
          />
          Remove invisible characters
        </label>
        <label>
          <input type="checkbox" checked={options.trimLines} onChange={() => toggle("trimLines")} />
          Trim each line
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.collapseSpaces}
            onChange={() => toggle("collapseSpaces")}
          />
          Collapse repeated spaces
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.collapseBlankLines}
            onChange={() => toggle("collapseBlankLines")}
          />
          Collapse blank lines
        </label>
      </div>
      <div className="dev-toolbar">
        <CopyButton value={output} />
      </div>
      <textarea className="dev-textarea output" readOnly value={output} />
    </section>
  );
}

function ClipboardView() {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let active = true;
    void storage.get<ClipboardItem[]>(CLIPBOARD_STORAGE_KEY).then((saved) => {
      if (active) {
        setItems(saved ?? []);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (ready) void storage.set(CLIPBOARD_STORAGE_KEY, items);
  }, [ready, items]);

  const save = (): void => {
    if (!draft.trim()) return;
    setItems((current) => [createClipboardItem(draft), ...current].slice(0, 30));
    setDraft("");
  };

  return (
    <section>
      <p className="eyebrow">Saved locally on this device — not synced with your OS clipboard.</p>
      <textarea
        className="dev-textarea"
        placeholder="Paste text to save it here for later"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="dev-toolbar">
        <button className="primary-action" onClick={save} disabled={!draft.trim()}>
          <Save size={15} /> Save snippet
        </button>
      </div>
      <div className="clipboard-shelf">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>Nothing saved yet.</p>
            <span>Snippets you save stay here until you delete them.</span>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id}>
              <div>
                <p>{item.text}</p>
                <time>{new Date(item.savedAt).toLocaleString()}</time>
              </div>
              <div className="clipboard-shelf-actions">
                <CopyButton value={item.text} />
                <button
                  className="dev-copy"
                  type="button"
                  onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
                  aria-label="Delete snippet"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function FindReplaceView() {
  const [input, setInput] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const result = useMemo(
    () => findReplace(input, find, replace, { useRegex, caseSensitive }),
    [input, find, replace, useRegex, caseSensitive],
  );

  return (
    <section>
      <div className="dev-field-row">
        <label className="field-label">
          Find
          <input value={find} onChange={(event) => setFind(event.target.value)} />
        </label>
        <label className="field-label">
          Replace with
          <input value={replace} onChange={(event) => setReplace(event.target.value)} />
        </label>
      </div>
      <div className="option-row">
        <label>
          <input type="checkbox" checked={useRegex} onChange={() => setUseRegex((v) => !v)} />
          Use regex
        </label>
        <label>
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={() => setCaseSensitive((v) => !v)}
          />
          Case sensitive
        </label>
      </div>
      <textarea
        className="dev-textarea"
        placeholder="Type or paste text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      {!result.ok ? (
        <p className="dev-error">{result.error}</p>
      ) : (
        <>
          <div className="dev-toolbar">
            <p className="eyebrow">{result.value.count} replaced</p>
            <CopyButton value={result.value.output} />
          </div>
          <textarea className="dev-textarea output" readOnly value={result.value.output} />
        </>
      )}
    </section>
  );
}

const LINE_OPERATIONS: { id: LineOperation; label: string }[] = [
  { id: "sort-asc", label: "Sort A→Z" },
  { id: "sort-desc", label: "Sort Z→A" },
  { id: "dedupe", label: "Remove duplicates" },
  { id: "reverse", label: "Reverse order" },
  { id: "number", label: "Number lines" },
  { id: "trim", label: "Trim each line" },
  { id: "remove-empty", label: "Remove empty lines" },
];

function LinesView() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder="One item per line"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="dev-toolbar">
        {LINE_OPERATIONS.map((operation) => (
          <button
            key={operation.id}
            className="secondary-action"
            onClick={() => setOutput(applyLineOperation(input, operation.id))}
          >
            {operation.label}
          </button>
        ))}
      </div>
      {output ? (
        <>
          <div className="dev-toolbar">
            <CopyButton value={output} />
          </div>
          <textarea className="dev-textarea output" readOnly value={output} />
        </>
      ) : null}
    </section>
  );
}

function SlugView() {
  const [input, setInput] = useState("");
  const [separator, setSeparator] = useState<SlugSeparator>("-");
  const output = useMemo(() => slugify(input, separator), [input, separator]);
  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder="A blog post title, a product name…"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="mode-switch dev-toolbar">
        <button className={separator === "-" ? "active" : ""} onClick={() => setSeparator("-")}>
          hyphen-case
        </button>
        <button className={separator === "_" ? "active" : ""} onClick={() => setSeparator("_")}>
          snake_case
        </button>
      </div>
      <div className="dev-toolbar">
        <CopyButton value={output} />
      </div>
      <textarea className="dev-textarea output" readOnly value={output} />
    </section>
  );
}

function LoremView() {
  const [paragraphs, setParagraphs] = useState(3);
  const [output, setOutput] = useState(() => generateLoremParagraphs(3));
  return (
    <section>
      <div className="dev-field-row">
        <label className="field-label">
          Paragraphs
          <input
            type="number"
            min={1}
            max={20}
            value={paragraphs}
            onChange={(event) =>
              setParagraphs(Math.max(1, Math.min(20, Number(event.target.value) || 1)))
            }
          />
        </label>
        <button
          className="primary-action"
          onClick={() => setOutput(generateLoremParagraphs(paragraphs))}
        >
          <RefreshCw size={15} /> Generate
        </button>
        <CopyButton value={output} />
      </div>
      <textarea className="dev-textarea output" readOnly value={output} />
    </section>
  );
}

function DiffView() {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const lines = useMemo(() => diffLines(before, after), [before, after]);
  const changed = lines.some((line) => line.type !== "same");
  return (
    <section>
      <div className="dev-grid">
        <textarea
          className="dev-textarea"
          placeholder="Original text"
          value={before}
          onChange={(event) => setBefore(event.target.value)}
        />
        <textarea
          className="dev-textarea"
          placeholder="Changed text"
          value={after}
          onChange={(event) => setAfter(event.target.value)}
        />
      </div>
      {before || after ? (
        <div className="diff-view">
          {changed ? (
            lines.map((line, index) => (
              <div key={index} className={line.type}>
                {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
                {line.text || " "}
              </div>
            ))
          ) : (
            <div className="same">No differences.</div>
          )}
        </div>
      ) : null}
    </section>
  );
}
