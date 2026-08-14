import { create } from "zustand";
import { entitlementService } from "../core/entitlements/LocalDevEntitlementProvider";
import type { EntitlementId } from "../core/entitlements/types";
import { storage } from "../core/storage/storage";

export type ThemePreference = "system" | "light" | "dark";
type AppState = {
  theme: ThemePreference;
  owned: Set<EntitlementId>;
  ready: boolean;
  initialize: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  refreshEntitlements: () => Promise<void>;
};

const applyTheme = (theme: ThemePreference): void => {
  const dark =
    theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
};

export const useAppStore = create<AppState>((set) => ({
  theme: "system",
  owned: new Set(),
  ready: false,
  initialize: async () => {
    try {
      const [savedTheme, owned] = await Promise.all([
        storage.get<ThemePreference>("theme"),
        entitlementService.listOwned(),
      ]);
      const theme = savedTheme ?? "system";
      applyTheme(theme);
      set({ theme, owned: new Set(owned), ready: true });
    } catch {
      applyTheme("system");
      set({ theme: "system", owned: new Set(), ready: true });
    }
  },
  setTheme: async (theme) => {
    applyTheme(theme);
    set({ theme });
    await storage.set("theme", theme);
  },
  refreshEntitlements: async () => {
    await entitlementService.refresh();
    set({ owned: new Set(await entitlementService.listOwned()) });
  },
}));

export const canUseTool = (
  free: boolean,
  entitlement: EntitlementId,
  owned: Set<EntitlementId>,
): boolean => free || owned.has(entitlement);
