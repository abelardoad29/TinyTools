import { describe, expect, it } from "vitest";
import {
  applyLineOperation,
  cleanText,
  convertCase,
  countText,
  diffLines,
  findReplace,
  generateLoremParagraphs,
  slugify,
} from "../domain";

describe("case conversion", () => {
  it("converts to camelCase, snake_case, and kebab-case", () => {
    expect(convertCase("Hello World", "camel")).toBe("helloWorld");
    expect(convertCase("Hello World", "snake")).toBe("hello_world");
    expect(convertCase("Hello World", "kebab")).toBe("hello-world");
    expect(convertCase("helloWorld", "constant")).toBe("HELLO_WORLD");
  });

  it("title-cases and sentence-cases while preserving structure", () => {
    expect(convertCase("the quick fox", "title")).toBe("The Quick Fox");
    expect(convertCase("hello. world? yes!", "sentence")).toBe("Hello. World? Yes!");
  });
});

describe("countText", () => {
  it("counts characters, words, lines, and paragraphs", () => {
    const stats = countText("Hello world\nSecond line\n\nNew paragraph");
    expect(stats.words).toBe(6);
    expect(stats.lines).toBe(4);
    expect(stats.paragraphs).toBe(2);
  });

  it("returns zeros for empty input", () => {
    expect(countText("")).toEqual({
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
    });
  });
});

describe("cleanText", () => {
  it("removes zero-width characters", () => {
    const zeroWidthSpace = String.fromCodePoint(0x200b);
    const input = `hello${zeroWidthSpace}world`;
    expect(
      cleanText(input, {
        removeInvisible: true,
        trimLines: false,
        collapseSpaces: false,
        collapseBlankLines: false,
      }),
    ).toBe("helloworld");
  });

  it("collapses repeated spaces and blank lines", () => {
    const result = cleanText("a   b\n\n\n\nc", {
      removeInvisible: false,
      trimLines: false,
      collapseSpaces: true,
      collapseBlankLines: true,
    });
    expect(result).toBe("a b\n\nc");
  });
});

describe("findReplace", () => {
  it("replaces plain text occurrences and counts them", () => {
    const result = findReplace("cat cat dog", "cat", "dog", {
      useRegex: false,
      caseSensitive: true,
    });
    expect(result).toEqual({ ok: true, value: { output: "dog dog dog", count: 2 } });
  });

  it("reports invalid regex patterns", () => {
    const result = findReplace("abc", "(", "x", { useRegex: true, caseSensitive: true });
    expect(result.ok).toBe(false);
  });
});

describe("applyLineOperation", () => {
  it("sorts, dedupes, and numbers lines", () => {
    expect(applyLineOperation("b\na\nc", "sort-asc")).toBe("a\nb\nc");
    expect(applyLineOperation("a\na\nb", "dedupe")).toBe("a\nb");
    expect(applyLineOperation("a\nb", "number")).toBe("1. a\n2. b");
  });

  it("removes empty lines", () => {
    expect(applyLineOperation("a\n\nb\n", "remove-empty")).toBe("a\nb");
  });
});

describe("slugify", () => {
  it("produces a lowercase, hyphenated slug", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("strips accents and collapses separators", () => {
    const accented = "Café   con   leche";
    expect(slugify(accented)).toBe("cafe-con-leche");
  });

  it("supports an underscore separator", () => {
    expect(slugify("Hello World", "_")).toBe("hello_world");
  });
});

describe("generateLoremParagraphs", () => {
  it("generates the requested number of paragraphs", () => {
    const text = generateLoremParagraphs(3);
    expect(text.split("\n\n")).toHaveLength(3);
    expect(text.endsWith(".")).toBe(true);
  });
});

describe("diffLines", () => {
  it("marks unchanged, added, and removed lines", () => {
    const result = diffLines("a\nb\nc", "a\nx\nc");
    expect(result).toEqual([
      { type: "same", text: "a" },
      { type: "removed", text: "b" },
      { type: "added", text: "x" },
      { type: "same", text: "c" },
    ]);
  });

  it("handles pure additions", () => {
    expect(diffLines("a", "a\nb")).toEqual([
      { type: "same", text: "a" },
      { type: "added", text: "b" },
    ]);
  });
});
