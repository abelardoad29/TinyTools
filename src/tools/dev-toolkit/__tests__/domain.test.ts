import { describe, expect, it } from "vitest";
import {
  csvToJsonArray,
  decodeBase64,
  decodeJwt,
  encodeBase64,
  formatJson,
  generateUuids,
  hashText,
  isoToUnix,
  jsonArrayToCsv,
  minifyJson,
  parseCsv,
  testRegex,
  unixToIso,
} from "../domain";

describe("json", () => {
  it("formats valid json with indentation", () => {
    const result = formatJson('{"a":1}');
    expect(result).toEqual({ ok: true, value: '{\n  "a": 1\n}' });
  });

  it("minifies valid json", () => {
    expect(minifyJson('{\n  "a": 1\n}')).toEqual({ ok: true, value: '{"a":1}' });
  });

  it("reports an error for invalid json", () => {
    const result = formatJson("{not json}");
    expect(result.ok).toBe(false);
  });
});

describe("base64", () => {
  it("round-trips unicode text", () => {
    const encoded = encodeBase64("héllo 👋");
    const decoded = decodeBase64(encoded);
    expect(decoded).toEqual({ ok: true, value: "héllo 👋" });
  });

  it("rejects invalid base64", () => {
    expect(decodeBase64("not base64!!").ok).toBe(false);
  });
});

describe("uuid", () => {
  it("generates the requested count, clamped between 1 and 100", () => {
    expect(generateUuids(3)).toHaveLength(3);
    expect(generateUuids(0)).toHaveLength(1);
    expect(generateUuids(500)).toHaveLength(100);
  });

  it("generates unique values", () => {
    const ids = generateUuids(20);
    expect(new Set(ids).size).toBe(20);
  });
});

describe("hash", () => {
  it("matches the known SHA-256 digest for an empty string", async () => {
    const digest = await hashText("", "SHA-256");
    expect(digest).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
});

describe("regex", () => {
  it("collects all matches with their index", () => {
    const result = testRegex("\\d+", "", "a12 b34");
    expect(result).toEqual({
      ok: true,
      value: [
        { match: "12", index: 1, groups: [] },
        { match: "34", index: 5, groups: [] },
      ],
    });
  });

  it("reports invalid patterns", () => {
    expect(testRegex("(", "", "abc").ok).toBe(false);
  });
});

describe("jwt", () => {
  it("decodes header and payload without verifying the signature", () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const result = decodeJwt(token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.header).toEqual({ alg: "HS256", typ: "JWT" });
      expect(result.value.payload).toMatchObject({ sub: "1234567890", name: "John Doe" });
    }
  });

  it("rejects tokens without enough segments", () => {
    expect(decodeJwt("not-a-token").ok).toBe(false);
  });
});

describe("unix time", () => {
  it("converts unix seconds to an ISO date and back", () => {
    const iso = unixToIso(0);
    expect(iso).toEqual({ ok: true, value: "1970-01-01T00:00:00.000Z" });
    expect(isoToUnix("1970-01-01T00:00:00.000Z")).toEqual({ ok: true, value: 0 });
  });
});

describe("csv", () => {
  it("parses quoted cells with embedded commas", () => {
    expect(parseCsv('a,"b,c"\n1,2')).toEqual([
      ["a", "b,c"],
      ["1", "2"],
    ]);
  });

  it("round-trips a flat json array through csv", () => {
    const json = JSON.stringify([
      { name: "Ana", age: "30" },
      { name: "Leo", age: "25" },
    ]);
    const csv = jsonArrayToCsv(json);
    expect(csv.ok).toBe(true);
    if (!csv.ok) return;
    const back = csvToJsonArray(csv.value);
    expect(back).toEqual({ ok: true, value: JSON.stringify(JSON.parse(json), null, 2) });
  });
});
