import { create } from "zustand";
import { entitlementService } from "../core/entitlements/GumroadEntitlementProvider";
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
  syncOwned: () => Promise<void>;
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
      // Revalidate in the background (catches a refund/chargeback) without blocking startup.
      void entitlementService.refresh().then(async () => {
        set({ owned: new Set(await entitlementService.listOwned()) });
      });
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
  // Re-reads cached entitlement state without a network call — use after redeem()/
  // deactivate() already updated the cache, to avoid a redundant verification request.
  syncOwned: async () => {
    set({ owned: new Set(await entitlementService.listOwned()) });
  },
}));

export const useIsPro = (): boolean => useAppStore((s) => s.owned.has("app.pro"));
