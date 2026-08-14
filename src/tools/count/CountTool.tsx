import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  LayoutGrid,
  List,
  Minus,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
} from "lucide-react";
import { ToolShell } from "../../components/tool-shell/ToolShell";
import { storage } from "../../core/storage/storage";
import { countManifest } from "./manifest";
import {
  createCounter,
  normalizeCounter,
  progressFor,
  type ResetMode,
  type UnifiedCounter,
} from "./domain";

type CountState = { counters: UnifiedCounter[]; view: "list" | "board" };
type LegacyCounter = { id: string; name: string; value: number; color?: string };
const STORAGE_KEY = "tool.count.unified.v1";

async function loadCountState(): Promise<CountState> {
  const saved = await storage.get<CountState>(STORAGE_KEY);
  if (saved?.counters)
    return { ...saved, counters: saved.counters.map((item) => normalizeCounter(item)) };
  const [simple, multi, board] = await Promise.all([
    storage.get<number>("tool.count.value"),
    storage.get<LegacyCounter[]>("tool.multi-count.items"),
    storage.get<LegacyCounter[]>("tool.counter-board.items"),
  ]);
  const legacy = [...(multi ?? []), ...(board ?? [])];
  const counters =
    legacy.length > 0
      ? legacy.map((item) =>
          createCounter(item.name, {
            id: item.id,
            value: item.value,
            color: item.color ?? "neutral",
          }),
        )
      : [createCounter("Count", { value: simple ?? 0 })];
  return { counters, view: legacy.length > 2 ? "board" : "list" };
}

export function CountTool() {
  const [state, setState] = useState<CountState>({ counters: [], view: "list" });
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    void loadCountState()
      .then((loaded) => {
        if (active) {
          setState(loaded);
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setState({ counters: [createCounter("Count")], view: "list" });
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (ready) void storage.set(STORAGE_KEY, state);
  }, [ready, state]);

  const selected = useMemo(
    () => state.counters.find((item) => item.id === selectedId) ?? null,
    [selectedId, state.counters],
  );
  const update = (id: string, change: (counter: UnifiedCounter) => UnifiedCounter): void =>
    setState((current) => ({
      ...current,
      counters: current.counters.map((item) => (item.id === id ? change(item) : item)),
    }));
  const add = (name: string, preset: "simple" | "goal" | "daily" | "session"): void => {
    const options =
      preset === "goal"
        ? { goal: 100 }
        : preset === "daily"
          ? { resetMode: "daily" as const }
          : preset === "session"
            ? { resetMode: "session" as const }
            : {};
    const counter = createCounter(name, options);
    setState((current) => ({ ...current, counters: [...current.counters, counter] }));
    setCreating(false);
    setSelectedId(counter.id);
  };

  if (!ready)
    return (
      <ToolShell tool={countManifest}>
        <div className="count-loading">Loading your counters…</div>
      </ToolShell>
    );
  if (creating)
    return (
      <ToolShell tool={countManifest}>
        <CreateCounter onCancel={() => setCreating(false)} onCreate={add} />
      </ToolShell>
    );
  if (selected)
    return (
      <ToolShell tool={countManifest}>
        <CounterDetail
          counter={selected}
          onBack={() => setSelectedId(null)}
          onChange={(change) => update(selected.id, change)}
          onDelete={() => {
            setState((current) => ({
              ...current,
              counters: current.counters.filter((item) => item.id !== selected.id),
            }));
            setSelectedId(null);
          }}
        />
      </ToolShell>
    );

  return (
    <ToolShell tool={countManifest}>
      <main className="unified-count">
        <header className="unified-heading">
          <div>
            <p className="eyebrow">Count.</p>
            <h1>What are you counting?</h1>
            <p>Keep every count together. Add structure only when you need it.</p>
          </div>
          <div className="view-switch" aria-label="View">
            <button
              className={state.view === "list" ? "active" : ""}
              onClick={() => setState((current) => ({ ...current, view: "list" }))}
              aria-label="List view"
            >
              <List size={17} />
            </button>
            <button
              className={state.view === "board" ? "active" : ""}
              onClick={() => setState((current) => ({ ...current, view: "board" }))}
              aria-label="Board view"
            >
              <LayoutGrid size={17} />
            </button>
          </div>
        </header>
        {state.counters.length === 0 ? (
          <div className="count-empty">
            <strong>Nothing to count yet.</strong>
            <span>Start simple. You can add a goal or reset schedule later.</span>
            <button className="primary-action" onClick={() => setCreating(true)}>
              <Plus size={17} /> New counter
            </button>
          </div>
        ) : (
          <>
            <div className={`unified-${state.view}`}>
              {state.counters.map((counter) => (
                <CounterItem
                  key={counter.id}
                  counter={counter}
                  board={state.view === "board"}
                  onOpen={() => setSelectedId(counter.id)}
                  onChange={(change) => update(counter.id, change)}
                />
              ))}
            </div>
            <button className="add-counter-button" onClick={() => setCreating(true)}>
              <Plus size={17} /> New counter
            </button>
          </>
        )}
      </main>
    </ToolShell>
  );
}

function CounterItem({
  counter,
  board,
  onOpen,
  onChange,
}: {
  counter: UnifiedCounter;
  board: boolean;
  onOpen: () => void;
  onChange: (change: (counter: UnifiedCounter) => UnifiedCounter) => void;
}) {
  const progress = progressFor(counter);
  return (
    <article className="unified-counter-item">
      <button className="counter-open" onClick={onOpen}>
        <span>{counter.name}</span>
        {progress === null ? null : (
          <small>
            {Math.round(progress)}% of {counter.goal}
          </small>
        )}
        <strong>{counter.value.toLocaleString()}</strong>
        {progress === null ? null : (
          <i>
            <span style={{ width: `${progress}%` }} />
          </i>
        )}
      </button>
      <footer>
        <button
          onClick={() => onChange((item) => ({ ...item, value: item.value - 1 }))}
          aria-label={`Decrease ${counter.name}`}
        >
          <Minus size={board ? 22 : 17} />
        </button>
        <button
          className="primary"
          onClick={() => onChange((item) => ({ ...item, value: item.value + 1 }))}
          aria-label={`Increase ${counter.name}`}
        >
          <Plus size={board ? 22 : 17} />
        </button>
      </footer>
    </article>
  );
}

function CreateCounter({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (name: string, preset: "simple" | "goal" | "daily" | "session") => void;
}) {
  const [name, setName] = useState("");
  const [preset, setPreset] = useState<"simple" | "goal" | "daily" | "session">("simple");
  return (
    <main className="count-form">
      <button className="back-link" onClick={onCancel}>
        <ChevronLeft size={16} /> All counters
      </button>
      <p className="eyebrow">New counter</p>
      <h1>Start with a name.</h1>
      <label>
        Name
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Visitors, laps, cups…"
        />
      </label>
      <fieldset>
        <legend>Start as</legend>
        {(["simple", "goal", "daily", "session"] as const).map((item) => (
          <button
            type="button"
            key={item}
            className={preset === item ? "selected" : ""}
            onClick={() => setPreset(item)}
          >
            <Check size={14} />
            {item === "simple"
              ? "Simple count"
              : item === "goal"
                ? "Goal"
                : item === "daily"
                  ? "Daily"
                  : "Session"}
          </button>
        ))}
      </fieldset>
      <button
        className="primary-action create-submit"
        onClick={() => onCreate(name, preset)}
        disabled={!name.trim()}
      >
        Create counter
      </button>
    </main>
  );
}

function CounterDetail({
  counter,
  onBack,
  onChange,
  onDelete,
}: {
  counter: UnifiedCounter;
  onBack: () => void;
  onChange: (change: (counter: UnifiedCounter) => UnifiedCounter) => void;
  onDelete: () => void;
}) {
  const [settings, setSettings] = useState(false);
  const progress = progressFor(counter);
  const reset = (): void =>
    onChange((item) => ({
      ...item,
      value: 0,
      history:
        item.resetMode === "session"
          ? [
              { label: "Session", value: item.value, timestamp: new Date().toISOString() },
              ...item.history,
            ].slice(0, 50)
          : item.history,
    }));
  return (
    <main className="count-detail">
      <header>
        <button className="back-link" onClick={onBack}>
          <ChevronLeft size={16} /> All counters
        </button>
        <button className="detail-settings" onClick={() => setSettings((value) => !value)}>
          <Settings2 size={16} /> Settings
        </button>
      </header>
      <section>
        <p className="eyebrow">
          {counter.resetMode === "daily"
            ? "Today"
            : counter.resetMode === "session"
              ? "Current session"
              : "Counter"}
        </p>
        <h1>{counter.name}</h1>
        <strong aria-live="polite">{counter.value.toLocaleString()}</strong>
        {progress === null ? null : (
          <div className="detail-progress">
            <span style={{ width: `${progress}%` }} />
            <small>
              {Math.round(progress)}% of {counter.goal}
            </small>
          </div>
        )}
        <div className="detail-actions">
          <button onClick={() => onChange((item) => ({ ...item, value: item.value - 1 }))}>
            <Minus />
          </button>
          <button
            className="primary"
            onClick={() => onChange((item) => ({ ...item, value: item.value + 1 }))}
          >
            <Plus />
          </button>
        </div>
        <button className="reset-button" onClick={reset} disabled={counter.value === 0}>
          <RotateCcw size={14} />
          {counter.resetMode === "session" ? "Finish session" : "Reset"}
        </button>
      </section>
      {settings ? (
        <aside className="count-settings">
          <label>
            Name
            <input
              value={counter.name}
              onChange={(event) => onChange((item) => ({ ...item, name: event.target.value }))}
            />
          </label>
          <label>
            Goal
            <input
              type="number"
              min="1"
              value={counter.goal ?? ""}
              placeholder="None"
              onChange={(event) =>
                onChange((item) => ({
                  ...item,
                  goal: event.target.value ? Math.max(1, Number(event.target.value)) : null,
                }))
              }
            />
          </label>
          <label>
            Reset
            <select
              value={counter.resetMode}
              onChange={(event) =>
                onChange((item) => ({ ...item, resetMode: event.target.value as ResetMode }))
              }
            >
              <option value="manual">Manually</option>
              <option value="daily">Every day</option>
              <option value="session">By session</option>
            </select>
          </label>
          <button className="danger-action" onClick={onDelete}>
            <Trash2 size={15} /> Delete counter
          </button>
        </aside>
      ) : null}
      {counter.history.length > 0 ? (
        <div className="count-history">
          <h2>History</h2>
          {counter.history.map((record) => (
            <div key={record.timestamp}>
              <span>{record.label}</span>
              <strong>{record.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </main>
  );
}
