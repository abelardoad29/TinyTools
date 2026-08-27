import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GumroadEntitlementProvider } from "../GumroadEntitlementProvider";

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

describe("GumroadEntitlementProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects an empty license key without calling the network", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const provider = new GumroadEntitlementProvider();
    const result = await provider.redeem("   ");
    expect(result).toEqual({ ok: false, error: "Enter a license key." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("activates Pro on a valid license key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ valid: true })));
    const provider = new GumroadEntitlementProvider();
    const result = await provider.redeem("VALID-KEY");
    expect(result).toEqual({ ok: true });
    expect(await provider.has("app.pro")).toBe(true);
    expect(await provider.listOwned()).toEqual(["app.pro"]);
  });

  it("reports the server's error for an invalid license key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ valid: false, error: "Not found." })),
    );
    const provider = new GumroadEntitlementProvider();
    const result = await provider.redeem("BAD-KEY");
    expect(result).toEqual({ ok: false, error: "Not found." });
    expect(await provider.has("app.pro")).toBe(false);
  });

  it("surfaces a connectivity error without changing stored state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const provider = new GumroadEntitlementProvider();
    const result = await provider.redeem("SOME-KEY");
    expect(result.ok).toBe(false);
    expect(await provider.has("app.pro")).toBe(false);
  });

  it("keeps the last known Pro state when refresh() can't reach the network", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ valid: true }))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new GumroadEntitlementProvider();
    await provider.redeem("VALID-KEY");
    await provider.refresh();
    expect(await provider.has("app.pro")).toBe(true);
  });

  it("does nothing on refresh() when no license key was ever redeemed", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const provider = new GumroadEntitlementProvider();
    await provider.refresh();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await provider.has("app.pro")).toBe(false);
  });

  it("clears Pro status on deactivate()", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ valid: true })));
    const provider = new GumroadEntitlementProvider();
    await provider.redeem("VALID-KEY");
    expect(await provider.has("app.pro")).toBe(true);
    await provider.deactivate();
    expect(await provider.has("app.pro")).toBe(false);
    expect(await provider.getLicenseKey()).toBe("");
  });
});
