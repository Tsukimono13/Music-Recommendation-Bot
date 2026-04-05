import { describe, it, expect } from "vitest";
import { escapeMarkdownV2 } from "./markdown";

describe("escapeMarkdownV2", () => {
  it("escapes special characters", () => {
    expect(escapeMarkdownV2("hello_world")).toBe("hello\\_world");
    expect(escapeMarkdownV2("AC/DC")).toBe("AC/DC"); // slash is not special
    expect(escapeMarkdownV2("test*bold*")).toBe("test\\*bold\\*");
  });

  it("escapes dots and exclamation marks", () => {
    expect(escapeMarkdownV2("Hello!")).toBe("Hello\\!");
    expect(escapeMarkdownV2("v2.0")).toBe("v2\\.0");
  });

  it("escapes parentheses and brackets", () => {
    expect(escapeMarkdownV2("(test)")).toBe("\\(test\\)");
    expect(escapeMarkdownV2("[link]")).toBe("\\[link\\]");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeMarkdownV2("Hello world")).toBe("Hello world");
  });

  it("handles empty string", () => {
    expect(escapeMarkdownV2("")).toBe("");
  });
});
