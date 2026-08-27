import type { Result } from "../../lib/result";

export type { Result } from "../../lib/result";

export type DevMode = "json" | "csv" | "base64" | "uuid" | "hash" | "regex" | "jwt" | "unixtime";

const describeJsonError = (error: unknown, input: string): string => {
  const message = error instanceof Error ? error.message : "Invalid JSON";
  const positionMatch = /position (\d+)/.exec(message);
  if (!positionMatch) return message;
  const position = Number(positionMatch[1]);
  const before = input.slice(0, position);
  const line = before.split("\n").length;
  const column = position - before.lastIndexOf("\n");
  return `${message} (line ${line}, column ${column})`;
};

export const formatJson = (input: string, indent = 2): Result<string> => {
  try {
    const parsed: unknown = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed, null, indent) };
  } catch (error) {
    return { ok: false, error: describeJsonError(error, input) };
  }
};

export const minifyJson = (input: string): Result<string> => {
  try {
    const parsed: unknown = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed) };
  } catch (error) {
    return { ok: false, error: describeJsonError(error, input) };
  }
};

export const parseCsv = (input: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((item) => !(item.length === 1 && item[0] === ""));
};

const escapeCsvCell = (value: unknown): string => {
  let text: string;
  if (value === null || value === undefined) {
    text = "";
  } else if (typeof value === "string") {
    text = value;
  } else if (typeof value === "number" || typeof value === "boolean") {
    text = String(value);
  } else {
    text = JSON.stringify(value);
  }
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const jsonArrayToCsv = (input: string): Result<string> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, error: "That's not valid JSON." };
  }
  if (
    !Array.isArray(parsed) ||
    parsed.some((row) => typeof row !== "object" || row === null || Array.isArray(row))
  ) {
    return { ok: false, error: "Expected a JSON array of flat objects." };
  }
  const rows = parsed as Record<string, unknown>[];
  const headers = Array.from(
    rows.reduce((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>()),
  );
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvCell(row[header])).join(","));
  }
  return { ok: true, value: lines.join("\n") };
};

export const csvToJsonArray = (input: string): Result<string> => {
  const rows = parseCsv(input.trim());
  if (rows.length === 0) return { ok: false, error: "No rows found." };
  const [headers, ...body] = rows as [string[], ...string[][]];
  const objects = body.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );
  return { ok: true, value: JSON.stringify(objects, null, 2) };
};

export const encodeBase64 = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

export const decodeBase64 = (input: string): Result<string> => {
  try {
    const binary = atob(input.trim());
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return { ok: true, value: new TextDecoder().decode(bytes) };
  } catch {
    return { ok: false, error: "That doesn't look like valid Base64." };
  }
};

export const generateUuids = (count: number): string[] =>
  Array.from({ length: Math.max(1, Math.min(100, Math.round(count) || 1)) }, () =>
    crypto.randomUUID(),
  );

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
export const HASH_ALGORITHMS: readonly HashAlgorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

export const hashText = async (input: string, algorithm: HashAlgorithm): Promise<string> => {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest(algorithm, data);
  return toHex(digest);
};

export const hashAll = async (input: string): Promise<Record<HashAlgorithm, string>> => {
  const entries = await Promise.all(
    HASH_ALGORITHMS.map(
      async (algorithm) => [algorithm, await hashText(input, algorithm)] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<HashAlgorithm, string>;
};

export type RegexMatch = { match: string; index: number; groups: string[] };

export const testRegex = (pattern: string, flags: string, input: string): Result<RegexMatch[]> => {
  if (pattern === "") return { ok: true, value: [] };
  try {
    const normalizedFlags = flags.includes("g") ? flags : `${flags}g`;
    const regex = new RegExp(pattern, normalizedFlags);
    const matches: RegexMatch[] = [];
    for (const match of input.matchAll(regex)) {
      matches.push({
        match: match[0],
        index: match.index ?? 0,
        groups: match.slice(1).filter((group): group is string => group !== undefined),
      });
    }
    return { ok: true, value: matches };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid pattern." };
  }
};

const base64UrlDecode = (segment: string): string => {
  const padded = segment
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(segment.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const decodeJwt = (token: string): Result<{ header: unknown; payload: unknown }> => {
  const [headerPart, payloadPart] = token.trim().split(".");
  if (!headerPart || !payloadPart)
    return { ok: false, error: "A JWT has three dot-separated parts." };
  try {
    const header: unknown = JSON.parse(base64UrlDecode(headerPart));
    const payload: unknown = JSON.parse(base64UrlDecode(payloadPart));
    return { ok: true, value: { header, payload } };
  } catch {
    return { ok: false, error: "Couldn't decode that token." };
  }
};

export const unixToIso = (seconds: number): Result<string> => {
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime())
    ? { ok: false, error: "Invalid timestamp." }
    : { ok: true, value: date.toISOString() };
};

export const isoToUnix = (iso: string): Result<number> => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? { ok: false, error: "Invalid date." }
    : { ok: true, value: Math.floor(date.getTime() / 1000) };
};
