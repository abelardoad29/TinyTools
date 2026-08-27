import { describe, expect, it } from "vitest";
import { isPurchaseValid } from "../verify-license";

describe("isPurchaseValid", () => {
  it("rejects an unsuccessful verification", () => {
    expect(isPurchaseValid({ success: false })).toBe(false);
  });

  it("accepts a successful verification with no purchase details", () => {
    expect(isPurchaseValid({ success: true })).toBe(true);
  });

  it("accepts a normal, untouched purchase", () => {
    expect(isPurchaseValid({ success: true, purchase: {} })).toBe(true);
  });

  it("rejects a refunded purchase", () => {
    expect(isPurchaseValid({ success: true, purchase: { refunded: true } })).toBe(false);
  });

  it("rejects a chargebacked purchase", () => {
    expect(isPurchaseValid({ success: true, purchase: { chargebacked: true } })).toBe(false);
  });

  it("rejects a cancelled subscription", () => {
    expect(
      isPurchaseValid({
        success: true,
        purchase: { subscription_cancelled_at: "2026-01-01T00:00:00Z" },
      }),
    ).toBe(false);
  });
});
