import { useEffect, useMemo, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { ProLock } from "../../components/pro/ProLock";
import { ToolShell } from "../../components/tool-shell/ToolShell";
import { useIsPro } from "../../stores/appStore";
import { devToolkitManifest } from "./manifest";
import {
  HASH_ALGORITHMS,
  csvToJsonArray,
  decodeBase64,
  decodeJwt,
  encodeBase64,
  formatJson,
  generateUuids,
  hashAll,
  isoToUnix,
  jsonArrayToCsv,
  minifyJson,
  testRegex,
  unixToIso,
  type DevMode,
  type HashAlgorithm,
  type Result,
} from "./domain";

const MODES: { id: DevMode; label: string }[] = [
  { id: "json", label: "JSON" },
  { id: "csv", label: "JSON ↔ CSV" },
  { id: "base64", label: "Base64" },
  { id: "uuid", label: "UUID" },
  { id: "hash", label: "Hash" },
  { id: "regex", label: "Regex" },
  { id: "jwt", label: "JWT" },
  { id: "unixtime", label: "Unix time" },
];

export function DevToolkitTool() {
  const isPro = useIsPro();
  const [mode, setMode] = useState<DevMode>("json");
  return (
    <ToolShell tool={devToolkitManifest}>
      <main className="dev-workspace">
        <header className="unified-heading">
          <div>
            <p className="eyebrow">Dev Toolkit.</p>
            <h1>Everyday developer utilities.</h1>
            <p>Nothing leaves your browser. Format, decode, generate, and check — all local.</p>
          </div>
          <div className="mode-switch" role="tablist" aria-label="Dev tool">
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
        <div className="dev-panel">
          {mode === "json" ? <JsonView /> : null}
          {mode === "csv" ? (
            isPro ? (
              <CsvView />
            ) : (
              <ProLock feature="JSON ↔ CSV conversion" />
            )
          ) : null}
          {mode === "base64" ? <Base64View /> : null}
          {mode === "uuid" ? <UuidView /> : null}
          {mode === "hash" ? <HashView /> : null}
          {mode === "regex" ? isPro ? <RegexView /> : <ProLock feature="Regex tester" /> : null}
          {mode === "jwt" ? <JwtView /> : null}
          {mode === "unixtime" ? <UnixTimeView /> : null}
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

function JsonView() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (action: (value: string) => Result<string>): void => {
    const result = action(input);
    if (result.ok) {
      setOutput(result.value);
      setError(null);
    } else {
      setError(result.error);
    }
  };

  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder='{"paste":"your json here"}'
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="dev-toolbar">
        <button className="secondary-action" onClick={() => run(formatJson)}>
          Format
        </button>
        <button className="secondary-action" onClick={() => run(minifyJson)}>
          Minify
        </button>
        <CopyButton value={output} />
      </div>
      {error ? <p className="dev-error">{error}</p> : null}
      {!error && output ? (
        <textarea className="dev-textarea output" readOnly value={output} />
      ) : null}
    </section>
  );
}

function CsvView() {
  const [direction, setDirection] = useState<"json-to-csv" | "csv-to-json">("json-to-csv");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const convert = (): void => {
    const result = direction === "json-to-csv" ? jsonArrayToCsv(input) : csvToJsonArray(input);
    if (result.ok) {
      setOutput(result.value);
      setError(null);
    } else {
      setOutput("");
      setError(result.error);
    }
  };

  return (
    <section>
      <div className="mode-switch dev-toolbar">
        <button
          className={direction === "json-to-csv" ? "active" : ""}
          onClick={() => setDirection("json-to-csv")}
        >
          JSON → CSV
        </button>
        <button
          className={direction === "csv-to-json" ? "active" : ""}
          onClick={() => setDirection("csv-to-json")}
        >
          CSV → JSON
        </button>
      </div>
      <textarea
        className="dev-textarea"
        placeholder={direction === "json-to-csv" ? '[{"name":"Ana"}]' : "name,age\nAna,30"}
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="dev-toolbar">
        <button className="secondary-action" onClick={convert}>
          Convert
        </button>
        <CopyButton value={output} />
      </div>
      {error ? <p className="dev-error">{error}</p> : null}
      {!error && output ? (
        <textarea className="dev-textarea output" readOnly value={output} />
      ) : null}
    </section>
  );
}

function Base64View() {
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const output: Result<string> = useMemo(() => {
    if (input === "") return { ok: true, value: "" };
    return direction === "encode" ? { ok: true, value: encodeBase64(input) } : decodeBase64(input);
  }, [direction, input]);

  return (
    <section>
      <div className="mode-switch dev-toolbar">
        <button
          className={direction === "encode" ? "active" : ""}
          onClick={() => setDirection("encode")}
        >
          Encode
        </button>
        <button
          className={direction === "decode" ? "active" : ""}
          onClick={() => setDirection("decode")}
        >
          Decode
        </button>
      </div>
      <textarea
        className="dev-textarea"
        placeholder={direction === "encode" ? "Text to encode" : "Base64 to decode"}
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      {!output.ok ? <p className="dev-error">{output.error}</p> : null}
      <div className="dev-toolbar">
        <CopyButton value={output.ok ? output.value : ""} />
      </div>
      {output.ok && output.value ? (
        <textarea className="dev-textarea output" readOnly value={output.value} />
      ) : null}
    </section>
  );
}

function UuidView() {
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[]>(() => generateUuids(5));

  return (
    <section>
      <div className="dev-field-row">
        <label className="field-label">
          Count
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(event) =>
              setCount(Math.max(1, Math.min(100, Number(event.target.value) || 1)))
            }
          />
        </label>
        <button className="primary-action" onClick={() => setIds(generateUuids(count))}>
          <RefreshCw size={15} /> Generate
        </button>
        <CopyButton value={ids.join("\n")} label="Copy all" />
      </div>
      <div className="dev-uuid-list">
        {ids.map((id) => (
          <div key={id}>
            <span>{id}</span>
            <CopyButton value={id} />
          </div>
        ))}
      </div>
    </section>
  );
}

function HashView() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<HashAlgorithm, string> | null>(null);

  useEffect(() => {
    let active = true;
    if (input === "") {
      setHashes(null);
      return;
    }
    void hashAll(input).then((result) => {
      if (active) setHashes(result);
    });
    return () => {
      active = false;
    };
  }, [input]);

  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder="Text to hash"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      {hashes ? (
        <dl className="dev-hash-list">
          {HASH_ALGORITHMS.map((algorithm) => (
            <div key={algorithm}>
              <dt>{algorithm}</dt>
              <dd>{hashes[algorithm]}</dd>
              <CopyButton value={hashes[algorithm]} />
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function RegexView() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("i");
  const [input, setInput] = useState("");
  const result = useMemo(() => testRegex(pattern, flags, input), [pattern, flags, input]);

  return (
    <section>
      <div className="dev-field-row">
        <label className="field-label">
          Pattern
          <input
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder="\d+"
          />
        </label>
        <label className="field-label">
          Flags
          <input
            value={flags}
            onChange={(event) => setFlags(event.target.value)}
            placeholder="gi"
          />
        </label>
      </div>
      <textarea
        className="dev-textarea"
        placeholder="Text to test against"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      {!result.ok ? (
        <p className="dev-error">{result.error}</p>
      ) : (
        <>
          <p className="eyebrow">
            {result.value.length} match{result.value.length === 1 ? "" : "es"}
          </p>
          <div className="dev-match-list">
            {result.value.map((match, index) => (
              <div key={`${match.index}-${index}`}>
                <strong>{match.match}</strong>
                <span>
                  at {match.index}
                  {match.groups.length > 0 ? ` · groups: ${match.groups.join(", ")}` : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function JwtView() {
  const [token, setToken] = useState("");
  const result = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);

  return (
    <section>
      <textarea
        className="dev-textarea"
        placeholder="Paste a JWT"
        value={token}
        onChange={(event) => setToken(event.target.value)}
      />
      {result && !result.ok ? <p className="dev-error">{result.error}</p> : null}
      {result?.ok ? (
        <div className="dev-grid">
          <div>
            <p className="eyebrow">Header</p>
            <pre className="dev-textarea output">
              {JSON.stringify(result.value.header, null, 2)}
            </pre>
          </div>
          <div>
            <p className="eyebrow">Payload</p>
            <pre className="dev-textarea output">
              {JSON.stringify(result.value.payload, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function UnixTimeView() {
  const [seconds, setSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [local, setLocal] = useState(() => new Date().toISOString().slice(0, 16));

  const fromUnix = unixToIso(seconds);
  const toUnix = isoToUnix(local.length === 16 ? `${local}:00` : local);

  return (
    <section className="dev-grid">
      <div>
        <label className="field-label">
          Unix timestamp (seconds)
          <input
            type="number"
            value={seconds}
            onChange={(event) => setSeconds(Number(event.target.value) || 0)}
          />
        </label>
        <div className="dev-toolbar">
          <button
            className="secondary-action"
            onClick={() => setSeconds(Math.floor(Date.now() / 1000))}
          >
            Now
          </button>
        </div>
        <p>{fromUnix.ok ? fromUnix.value : fromUnix.error}</p>
      </div>
      <div>
        <label className="field-label">
          Date and time (your timezone)
          <input
            type="datetime-local"
            value={local}
            onChange={(event) => setLocal(event.target.value)}
          />
        </label>
        <p>{toUnix.ok ? toUnix.value : toUnix.error}</p>
      </div>
    </section>
  );
}
