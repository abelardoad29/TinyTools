import { Monitor, Moon, Sun } from "lucide-react";
import { useAppStore, type ThemePreference } from "../../stores/appStore";

const options: { id: ThemePreference; label: string; icon: typeof Monitor }[] = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];
export function SettingsPage() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  return (
    <main className="settings-page">
      <header>
        <p className="eyebrow">Preferences</p>
        <h1>Settings</h1>
        <p>Make TinyTools feel at home on this computer.</p>
      </header>
      <section className="settings-group">
        <div>
          <h2>Appearance</h2>
          <p>Choose how TinyTools looks.</p>
        </div>
        <div className="theme-picker" role="radiogroup" aria-label="Theme">
          {options.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="radio"
              aria-checked={theme === id}
              className={theme === id ? "selected" : ""}
              onClick={() => void setTheme(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </section>
      <section className="settings-group about">
        <div>
          <h2>About</h2>
          <p>Foundation preview</p>
        </div>
        <dl>
          <div>
            <dt>Version</dt>
            <dd>0.1.0</dd>
          </div>
          <div>
            <dt>Storage</dt>
            <dd>Local, on this device</dd>
          </div>
        </dl>
      </section>
      <p className="settings-footnote">
        More preferences will appear here as each tool earns them.
      </p>
    </main>
  );
}
