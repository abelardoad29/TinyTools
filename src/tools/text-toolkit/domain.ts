import type { Result } from "../../lib/result";

export type { Result } from "../../lib/result";

export type TextMode =
  "case" | "count" | "clean" | "clipboard" | "find-replace" | "lines" | "slug" | "lorem" | "diff";

export type CaseMode =
  "upper" | "lower" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab" | "constant";

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

const toWords = (input: string): string[] =>
  input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

const toTitleCase = (input: string): string =>
  input.replace(/\w\S*/g, (word) => capitalize(word.toLowerCase()));

const toSentenceCase = (input: string): string =>
  input.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());

export const convertCase = (input: string, mode: CaseMode): string => {
  switch (mode) {
    case "upper":
      return input.toUpperCase();
    case "lower":
      return input.toLowerCase();
    case "title":
      return toTitleCase(input);
    case "sentence":
      return toSentenceCase(input);
    case "camel": {
      const words = toWords(input);
      return words.map((word, index) => (index === 0 ? word : capitalize(word))).join("");
    }
    case "pascal":
      return toWords(input).map(capitalize).join("");
    case "snake":
      return toWords(input).join("_");
    case "kebab":
      return toWords(input).join("-");
    case "constant":
      return toWords(input).join("_").toUpperCase();
  }
};

export type TextStats = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
};

export const countText = (input: string): TextStats => ({
  characters: input.length,
  charactersNoSpaces: input.replace(/\s/g, "").length,
  words: input.trim() === "" ? 0 : input.trim().split(/\s+/).length,
  lines: input === "" ? 0 : input.split("\n").length,
  paragraphs:
    input.trim() === ""
      ? 0
      : input.split(/\n\s*\n/).filter((paragraph) => paragraph.trim() !== "").length,
});

export type CleanOptions = {
  removeInvisible: boolean;
  trimLines: boolean;
  collapseSpaces: boolean;
  collapseBlankLines: boolean;
};

const INVISIBLE_CODE_POINTS = [0x200b, 0x200c, 0x200d, 0xfeff];

const stripInvisibleChars = (input: string): string => {
  let result = input;
  for (const codePoint of INVISIBLE_CODE_POINTS) {
    result = result.split(String.fromCodePoint(codePoint)).join("");
  }
  return result;
};

export const cleanText = (input: string, options: CleanOptions): string => {
  let result = input;
  if (options.removeInvisible) result = stripInvisibleChars(result);
  if (options.trimLines)
    result = result
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  if (options.collapseSpaces) result = result.replace(/[ \t]+/g, " ");
  if (options.collapseBlankLines) result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
};

export type ClipboardItem = { id: string; text: string; savedAt: string };

export const createClipboardItem = (text: string): ClipboardItem => ({
  id: crypto.randomUUID(),
  text,
  savedAt: new Date().toISOString(),
});

export type FindReplaceOptions = { useRegex: boolean; caseSensitive: boolean };

export const findReplace = (
  input: string,
  find: string,
  replace: string,
  options: FindReplaceOptions,
): Result<{ output: string; count: number }> => {
  if (find === "") return { ok: true, value: { output: input, count: 0 } };
  try {
    const flags = options.caseSensitive ? "g" : "gi";
    const pattern = options.useRegex ? find : find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(pattern, flags);
    let count = 0;
    const output = input.replace(regex, () => {
      count += 1;
      return replace;
    });
    return { ok: true, value: { output, count } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid pattern." };
  }
};

export type LineOperation =
  "sort-asc" | "sort-desc" | "dedupe" | "reverse" | "number" | "trim" | "remove-empty";

export const applyLineOperation = (input: string, operation: LineOperation): string => {
  const lines = input.split("\n");
  switch (operation) {
    case "sort-asc":
      return [...lines].sort((a, b) => a.localeCompare(b)).join("\n");
    case "sort-desc":
      return [...lines].sort((a, b) => b.localeCompare(a)).join("\n");
    case "dedupe":
      return Array.from(new Set(lines)).join("\n");
    case "reverse":
      return [...lines].reverse().join("\n");
    case "number":
      return lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
    case "trim":
      return lines.map((line) => line.trim()).join("\n");
    case "remove-empty":
      return lines.filter((line) => line.trim() !== "").join("\n");
  }
};

export type SlugSeparator = "-" | "_";

const isCombiningMark = (char: string): boolean => {
  const codePoint = char.codePointAt(0) ?? 0;
  return codePoint >= 0x0300 && codePoint <= 0x036f;
};

const stripDiacritics = (input: string): string =>
  Array.from(input.normalize("NFD"))
    .filter((char) => !isCombiningMark(char))
    .join("");

export const slugify = (input: string, separator: SlugSeparator = "-"): string => {
  const collapsed = stripDiacritics(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, separator);
  const collapsedSeparators = collapsed.replace(new RegExp(`${separator}{2,}`, "g"), separator);
  return collapsedSeparators.replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "");
};

const LOREM_WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
];

const randomLoremWord = (): string => {
  const word = LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
  return word ?? "lorem";
};

export const generateLoremSentence = (wordCount: number): string => {
  const words = Array.from({ length: Math.max(3, wordCount) }, randomLoremWord);
  const sentence = words.join(" ");
  return capitalize(sentence) + ".";
};

export const generateLoremParagraphs = (paragraphs: number, sentencesPerParagraph = 4): string =>
  Array.from({ length: Math.max(1, paragraphs) }, () =>
    Array.from({ length: Math.max(1, sentencesPerParagraph) }, () =>
      generateLoremSentence(6 + Math.floor(Math.random() * 8)),
    ).join(" "),
  ).join("\n\n");

export type DiffLine = { type: "same" | "added" | "removed"; text: string };

export const diffLines = (before: string, after: string): DiffLine[] => {
  const a = before.split("\n");
  const b = after.split("\n");
  const m = a.length;
  const n = b.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      lcs[i]![j] =
        a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      result.push({ type: "same", text: a[i]! });
      i += 1;
      j += 1;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      result.push({ type: "removed", text: a[i]! });
      i += 1;
    } else {
      result.push({ type: "added", text: b[j]! });
      j += 1;
    }
  }
  while (i < m) {
    result.push({ type: "removed", text: a[i]! });
    i += 1;
  }
  while (j < n) {
    result.push({ type: "added", text: b[j]! });
    j += 1;
  }
  return result;
};
