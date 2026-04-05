import { describe, it, expect } from "vitest";
import { capitalizeWords } from "./capitalize";

describe("capitalizeWords", () => {
  it("capitalizes first letter of each word", () => {
    expect(capitalizeWords("thrash metal")).toBe("Thrash Metal");
  });

  it("handles single word", () => {
    expect(capitalizeWords("rock")).toBe("Rock");
  });

  it("preserves already capitalized text", () => {
    expect(capitalizeWords("Heavy Metal")).toBe("Heavy Metal");
  });

  it("handles empty string", () => {
    expect(capitalizeWords("")).toBe("");
  });

  it("handles multiple spaces", () => {
    expect(capitalizeWords("a  b")).toBe("A  B");
  });
});
