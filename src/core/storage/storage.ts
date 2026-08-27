export interface KeyValueStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}

class LocalStorageAdapter implements KeyValueStorage {
  async get<T>(key: string): Promise<T | null> {
    const value = window.localStorage.getItem(key);
    if (value === null) return Promise.resolve(null);
    try {
      return Promise.resolve(JSON.parse(value) as T);
    } catch {
      window.localStorage.removeItem(key);
      return Promise.resolve(null);
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    window.localStorage.setItem(key, JSON.stringify(value));
    return Promise.resolve();
  }
}

class TauriStoreAdapter implements KeyValueStorage {
  private storePromise = import("@tauri-apps/plugin-store").then(({ load }) =>
    load("preferences.json", { autoSave: 150 }),
  );

  async get<T>(key: string): Promise<T | null> {
    const store = await this.storePromise;
    return (await store.get<T>(key)) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const store = await this.storePromise;
    await store.set(key, value);
  }
}

export const isTauri = (): boolean => "__TAURI_INTERNALS__" in window;

export const storage: KeyValueStorage = isTauri()
  ? new TauriStoreAdapter()
  : new LocalStorageAdapter();
