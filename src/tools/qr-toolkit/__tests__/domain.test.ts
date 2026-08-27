import { describe, expect, it } from "vitest";
import { buildWifiQrPayload, parseBatchLines } from "../domain";

describe("buildWifiQrPayload", () => {
  it("builds a WPA payload with an escaped password", () => {
    const payload = buildWifiQrPayload({
      ssid: "Home Net",
      password: "p;ss:word",
      encryption: "WPA",
      hidden: false,
    });
    expect(payload).toBe("WIFI:T:WPA;S:Home Net;P:p\\;ss\\:word;;");
  });

  it("omits the password field for open networks", () => {
    const payload = buildWifiQrPayload({
      ssid: "Guest",
      password: "",
      encryption: "nopass",
      hidden: false,
    });
    expect(payload).toBe("WIFI:T:nopass;S:Guest;;");
  });

  it("marks the network as hidden when requested", () => {
    const payload = buildWifiQrPayload({
      ssid: "Secret",
      password: "hunter2",
      encryption: "WEP",
      hidden: true,
    });
    expect(payload).toBe("WIFI:T:WEP;S:Secret;P:hunter2;H:true;;");
  });
});

describe("parseBatchLines", () => {
  it("trims, drops blank lines, and preserves order", () => {
    expect(parseBatchLines("  a \n\nb\n   \nc")).toEqual(["a", "b", "c"]);
  });

  it("caps the number of lines", () => {
    const input = Array.from({ length: 10 }, (_, i) => `line${i}`).join("\n");
    expect(parseBatchLines(input, 3)).toEqual(["line0", "line1", "line2"]);
  });
});
