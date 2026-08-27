import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Flag, Pause, Play, Plus, RotateCcw, SkipForward, Trash2 } from "lucide-react";
import { ProLock } from "../../components/pro/ProLock";
import { ToolShell } from "../../components/tool-shell/ToolShell";
import { storage } from "../../core/storage/storage";
import { useIsPro } from "../../stores/appStore";
import { timeManifest } from "./manifest";
import {
  advancePomodoroPhase,
  createCountdownTarget,
  createPomodoro,
  createRun,
  createTimeState,
  elapsedFor,
  formatClock,
  formatCountdownParts,
  lapStopwatch,
  msUntilTarget,
  pauseRun,
  pauseStopwatch,
  recordSession,
  remainingOf,
  resetStopwatch,
  startRun,
  startStopwatch,
  type CountdownTarget,
  type TimeMode,
  type TimeState,
} from "./domain";

const STORAGE_KEY = "tool.time.unified.v1";
const MODES: { id: TimeMode; label: string }[] = [
  { id: "timer", label: "Timer" },
  { id: "stopwatch", label: "Stopwatch" },
  { id: "pomodoro", label: "Pomodoro" },
  { id: "countdown", label: "Countdown" },
];

let audioCtx: AudioContext | null = null;
function playChime(): void {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio isn't always available (autoplay policy, unsupported browser) — completion still updates the UI.
  }
}

async function loadTimeState(): Promise<TimeState> {
  const saved = await storage.get<TimeState>(STORAGE_KEY);
  if (!saved) return createTimeState();
  return {
    ...saved,
    timer: saved.timer.endsAt !== null ? pauseRun(saved.timer) : saved.timer,
    stopwatch:
      saved.stopwatch.startedAt !== null ? pauseStopwatch(saved.stopwatch) : saved.stopwatch,
    pomodoro: {
      ...saved.pomodoro,
      run: saved.pomodoro.run.endsAt !== null ? pauseRun(saved.pomodoro.run) : saved.pomodoro.run,
    },
  };
}

type ViewProps = { state: TimeState; now: number; onChange: Dispatch<SetStateAction<TimeState>> };

export function TimeTool() {
  const isPro = useIsPro();
  const [state, setState] = useState<TimeState>(createTimeState);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void loadTimeState()
      .then((loaded) => {
        if (active) {
          setState(loaded);
          setReady(true);
        }
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (ready) void storage.set(STORAGE_KEY, state);
  }, [ready, state]);

  useEffect(() => {
    const active =
      state.timer.endsAt !== null ||
      state.pomodoro.run.endsAt !== null ||
      state.stopwatch.startedAt !== null;
    if (!active) return;
    const id = setInterval(() => {
      setNow(Date.now());
      setState((current) => {
        let next = current;
        if (current.timer.endsAt !== null && current.timer.endsAt <= Date.now()) {
          playChime();
          next = {
            ...next,
            timer: createRun(current.timerMinutes * 60_000),
            history: recordSession(next.history, {
              label: "Timer",
              durationMs: current.timer.totalMs,
              completedAt: new Date().toISOString(),
            }),
          };
        }
        if (current.pomodoro.run.endsAt !== null && current.pomodoro.run.endsAt <= Date.now()) {
          playChime();
          const wasFocus = current.pomodoro.phase === "focus";
          next = {
            ...next,
            pomodoro: advancePomodoroPhase(current.pomodoro),
            history: wasFocus
              ? recordSession(next.history, {
                  label: "Pomodoro focus",
                  durationMs: current.pomodoro.run.totalMs,
                  completedAt: new Date().toISOString(),
                })
              : next.history,
          };
        }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [state.timer.endsAt, state.pomodoro.run.endsAt, state.stopwatch.startedAt]);

  useEffect(() => {
    if (state.mode !== "countdown" || state.countdowns.length === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.mode, state.countdowns.length]);

  const setMode = (mode: TimeMode): void => setState((current) => ({ ...current, mode }));

  if (!ready)
    return (
      <ToolShell tool={timeManifest}>
        <div className="count-loading">Loading your timers…</div>
      </ToolShell>
    );

  return (
    <ToolShell tool={timeManifest}>
      <main className="time-workspace">
        <header className="unified-heading">
          <div>
            <p className="eyebrow">Time.</p>
            <h1>Keep time, your way.</h1>
            <p>Timer, stopwatch, Pomodoro, and countdowns — one quiet place.</p>
          </div>
          <div className="mode-switch" role="tablist" aria-label="Time mode">
            {MODES.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={state.mode === item.id}
                className={state.mode === item.id ? "active" : ""}
                onClick={() => setMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>
        {state.mode === "timer" ? (
          <TimerView state={state} now={now} onChange={setState} />
        ) : state.mode === "stopwatch" ? (
          <StopwatchView state={state} now={now} onChange={setState} />
        ) : state.mode === "pomodoro" ? (
          <PomodoroView state={state} now={now} onChange={setState} />
        ) : (
          <CountdownView state={state} now={now} onChange={setState} />
        )}
        {(state.mode === "timer" || state.mode === "pomodoro") && state.history.length > 0 ? (
          isPro ? (
            <div className="session-history">
              <h2>History</h2>
              {state.history.map((record) => (
                <div key={record.id}>
                  <span>{record.label}</span>
                  <time>{new Date(record.completedAt).toLocaleTimeString()}</time>
                </div>
              ))}
            </div>
          ) : (
            <ProLock feature="Session history" />
          )
        ) : null}
      </main>
    </ToolShell>
  );
}

function TimerView({ state, now, onChange }: ViewProps) {
  const remaining = remainingOf(state.timer, now);
  const running = state.timer.endsAt !== null;
  const untouched = !running && remaining === state.timer.totalMs;
  return (
    <section className="session-current">
      <strong aria-live="polite">{formatClock(remaining)}</strong>
      {untouched ? (
        <label className="field-label timer-minutes">
          Minutes
          <input
            type="number"
            min={1}
            max={180}
            value={state.timerMinutes}
            onChange={(event) => {
              const minutes = Math.max(1, Math.min(180, Number(event.target.value) || 1));
              onChange((current) => ({
                ...current,
                timerMinutes: minutes,
                timer: createRun(minutes * 60_000),
              }));
            }}
          />
        </label>
      ) : null}
      <div>
        {running ? (
          <button
            onClick={() => onChange((current) => ({ ...current, timer: pauseRun(current.timer) }))}
          >
            <Pause />
          </button>
        ) : (
          <button
            className="primary-action"
            disabled={remaining <= 0}
            onClick={() => onChange((current) => ({ ...current, timer: startRun(current.timer) }))}
          >
            <Play />
          </button>
        )}
      </div>
      {!untouched ? (
        <button
          className="finish-session"
          onClick={() =>
            onChange((current) => ({ ...current, timer: createRun(current.timerMinutes * 60_000) }))
          }
        >
          <RotateCcw size={14} /> Reset
        </button>
      ) : null}
    </section>
  );
}

function StopwatchView({ state, now, onChange }: ViewProps) {
  const elapsed = elapsedFor(state.stopwatch, now);
  const running = state.stopwatch.startedAt !== null;
  return (
    <section className="session-current">
      <strong aria-live="polite">{formatClock(elapsed)}</strong>
      <div>
        {running ? (
          <>
            <button
              onClick={() =>
                onChange((current) => ({ ...current, stopwatch: lapStopwatch(current.stopwatch) }))
              }
            >
              <Flag />
            </button>
            <button
              className="primary-action"
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  stopwatch: pauseStopwatch(current.stopwatch),
                }))
              }
            >
              <Pause />
            </button>
          </>
        ) : (
          <button
            className="primary-action"
            onClick={() =>
              onChange((current) => ({ ...current, stopwatch: startStopwatch(current.stopwatch) }))
            }
          >
            <Play />
          </button>
        )}
      </div>
      {!running && elapsed > 0 ? (
        <button
          className="finish-session"
          onClick={() => onChange((current) => ({ ...current, stopwatch: resetStopwatch() }))}
        >
          <RotateCcw size={14} /> Reset
        </button>
      ) : null}
      {state.stopwatch.laps.length > 0 ? (
        <div className="session-history">
          <h2>Laps</h2>
          {state.stopwatch.laps.map((lap, index) => (
            <div key={`${lap}-${index}`}>
              <span>Lap {state.stopwatch.laps.length - index}</span>
              <strong>{formatClock(lap)}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function PomodoroView({ state, now, onChange }: ViewProps) {
  const { pomodoro } = state;
  const remaining = remainingOf(pomodoro.run, now);
  const running = pomodoro.run.endsAt !== null;
  const untouched = !running && remaining === pomodoro.run.totalMs;
  return (
    <section className="session-current">
      <p className="eyebrow">
        {pomodoro.phase === "focus" ? "Focus" : "Break"} · Cycle {pomodoro.cyclesCompleted + 1}
      </p>
      <strong aria-live="polite">{formatClock(remaining)}</strong>
      {untouched ? (
        <div className="pomodoro-settings">
          <label className="field-label">
            Focus (min)
            <input
              type="number"
              min={1}
              max={120}
              value={pomodoro.settings.focusMinutes}
              onChange={(event) => {
                const minutes = Math.max(1, Math.min(120, Number(event.target.value) || 1));
                onChange((current) => {
                  const settings = { ...current.pomodoro.settings, focusMinutes: minutes };
                  return {
                    ...current,
                    pomodoro: { ...current.pomodoro, settings, run: createRun(minutes * 60_000) },
                  };
                });
              }}
            />
          </label>
          <label className="field-label">
            Break (min)
            <input
              type="number"
              min={1}
              max={60}
              value={pomodoro.settings.breakMinutes}
              onChange={(event) => {
                const minutes = Math.max(1, Math.min(60, Number(event.target.value) || 1));
                onChange((current) => ({
                  ...current,
                  pomodoro: {
                    ...current.pomodoro,
                    settings: { ...current.pomodoro.settings, breakMinutes: minutes },
                  },
                }));
              }}
            />
          </label>
        </div>
      ) : null}
      <div>
        {running ? (
          <button
            onClick={() =>
              onChange((current) => ({
                ...current,
                pomodoro: { ...current.pomodoro, run: pauseRun(current.pomodoro.run) },
              }))
            }
          >
            <Pause />
          </button>
        ) : (
          <button
            className="primary-action"
            onClick={() =>
              onChange((current) => ({
                ...current,
                pomodoro: { ...current.pomodoro, run: startRun(current.pomodoro.run) },
              }))
            }
          >
            <Play />
          </button>
        )}
        <button
          aria-label="Skip to next phase"
          onClick={() =>
            onChange((current) => ({
              ...current,
              pomodoro: advancePomodoroPhase(current.pomodoro),
            }))
          }
        >
          <SkipForward />
        </button>
      </div>
      <button
        className="finish-session"
        onClick={() =>
          onChange((current) => ({
            ...current,
            pomodoro: createPomodoro(current.pomodoro.settings),
          }))
        }
      >
        <RotateCcw size={14} /> Restart
      </button>
    </section>
  );
}

function CountdownView({ state, now, onChange }: ViewProps) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const add = (): void => {
    if (!date) return;
    const target = createCountdownTarget(label, new Date(date).toISOString());
    onChange((current) => ({ ...current, countdowns: [...current.countdowns, target] }));
    setLabel("");
    setDate("");
  };
  return (
    <section>
      <div className="counter-add">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="What are you counting down to?"
        />
        <input
          type="datetime-local"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <button className="primary-action" onClick={add} disabled={!date}>
          <Plus size={16} /> Add
        </button>
      </div>
      {state.countdowns.length === 0 ? (
        <div className="empty-state">
          <p>No countdowns yet.</p>
          <span>Add a date you're counting down to.</span>
        </div>
      ) : (
        <div className="counter-stack">
          {state.countdowns.map((target) => (
            <CountdownRow
              key={target.id}
              target={target}
              now={now}
              onDelete={() =>
                onChange((current) => ({
                  ...current,
                  countdowns: current.countdowns.filter((item) => item.id !== target.id),
                }))
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CountdownRow({
  target,
  now,
  onDelete,
}: {
  target: CountdownTarget;
  now: number;
  onDelete: () => void;
}) {
  const remaining = msUntilTarget(target, now);
  return (
    <div className="counter-list-item">
      <div>
        <p>{target.label}</p>
        <span>{new Date(target.targetIso).toLocaleString()}</span>
      </div>
      <strong className="countdown-value">
        {remaining <= 0 ? "Now" : formatCountdownParts(remaining)}
      </strong>
      <button className="quiet-icon" onClick={onDelete} aria-label={`Remove ${target.label}`}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}
