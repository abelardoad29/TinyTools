import { storage } from "../storage/storage";
import type { EntitlementId, EntitlementService } from "./types";

const LICENSE_KEY_STORAGE = "license.key";
const LICENSE_CACHE_STORAGE = "license.cache.v1";
// Relative path works for the web build (same origin as the Functions endpoint).
// The desktop build has no server of its own — set VITE_VERIFY_ENDPOINT to the
// deployed web app's absolute URL (e.g. https://tinytools.pages.dev/api/verify-license)
// when building for Tauri, once that domain exists.
const VERIFY_ENDPOINT =
  (import.meta.env.VITE_VERIFY_ENDPOINT as string | undefined) || "/api/verify-license";

export type LicenseCache = { pro: boolean; verifiedAt: string };
export type VerifyResponse = { valid: boolean; error?: string };
export type RedeemResult = { ok: true } | { ok: false; error: string };

/**
 * Talks to our own `/api/verify-license` edge function, which proxies Gumroad's
 * license verification API server-side (Gumroad's API has no CORS support, so it
 * can't be called directly from the browser). See `functions/api/verify-license.ts`.
 */
export class GumroadEntitlementProvider implements EntitlementService {
  private cache: LicenseCache | null = null;
  private loaded = false;

  async has(entitlement: EntitlementId): Promise<boolean> {
    if (entitlement !== "app.pro") return false;
    await this.ensureLoaded();
    return this.cache?.pro ?? false;
  }

  async listOwned(): Promise<EntitlementId[]> {
    await this.ensureLoaded();
    return this.cache?.pro ? ["app.pro"] : [];
  }

  async refresh(): Promise<void> {
    const key = await storage.get<string>(LICENSE_KEY_STORAGE);
    if (!key) return;
    try {
      const result = await this.verifyRemote(key);
      await this.cacheResult(result);
    } catch {
      // Offline or the endpoint is unreachable — keep the last verified state instead
      // of punishing the user for a temporary connectivity issue.
    }
  }

  async getLicenseKey(): Promise<string | null> {
    return storage.get<string>(LICENSE_KEY_STORAGE);
  }

  async redeem(licenseKey: string): Promise<RedeemResult> {
    const trimmed = licenseKey.trim();
    if (!trimmed) return { ok: false, error: "Enter a license key." };
    let result: VerifyResponse;
    try {
      result = await this.verifyRemote(trimmed);
    } catch {
      return {
        ok: false,
        error: "Couldn't reach the verification service. Check your connection and try again.",
      };
    }
    await this.cacheResult(result);
    if (!result.valid) return { ok: false, error: result.error ?? "That license key isn't valid." };
    await storage.set(LICENSE_KEY_STORAGE, trimmed);
    return { ok: true };
  }

  async deactivate(): Promise<void> {
    await storage.set(LICENSE_KEY_STORAGE, "");
    await this.cacheResult({ valid: false });
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.cache = await storage.get<LicenseCache>(LICENSE_CACHE_STORAGE);
    this.loaded = true;
  }

  private async verifyRemote(licenseKey: string): Promise<VerifyResponse> {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey }),
    });
    return (await response.json()) as VerifyResponse;
  }

  private async cacheResult(result: VerifyResponse): Promise<void> {
    this.cache = { pro: result.valid, verifiedAt: new Date().toISOString() };
    this.loaded = true;
    await storage.set(LICENSE_CACHE_STORAGE, this.cache);
  }
}

export const entitlementService = new GumroadEntitlementProvider();
