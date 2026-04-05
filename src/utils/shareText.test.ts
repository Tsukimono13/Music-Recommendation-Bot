import { describe, it, expect } from "vitest";
import { formatShareText, buildShareUrl } from "./shareText";
import type { RecommendResult } from "./formattedRecommendations";

function makeArtist(name: string, score: number) {
  return { artist: name, score };
}

describe("formatShareText", () => {
  it("formats artists by tier", () => {
    const result: RecommendResult = {
      artists: [
        makeArtist("Megadeth", 95),
        makeArtist("Anthrax", 60),
        makeArtist("Exodus", 40),
      ],
    };
    const text = formatShareText(result);
    expect(text).toContain("Megadeth — 95%");
    expect(text).toContain("Anthrax — 60%");
    expect(text).toContain("Exodus");
    expect(text).toContain("@MusiGemBot");
    expect(text).toContain("t.me/MusiGemBot");
  });

  it("uses fallback artists when no scored artists", () => {
    const result: RecommendResult = {
      artists: [],
      fallbackArtists: [{ artist: "Fallback One" }, { artist: "Fallback Two" }],
    };
    const text = formatShareText(result);
    expect(text).toContain("Fallback One");
    expect(text).toContain("Fallback Two");
  });

  it("limits maybe artists to 5", () => {
    const artists = Array.from({ length: 10 }, (_, i) =>
      makeArtist(`Band${i}`, 30),
    );
    const text = formatShareText({ artists });
    // Only first 5 low-score artists should appear
    expect(text).toContain("Band0");
    expect(text).toContain("Band4");
    expect(text).not.toContain("Band5");
  });

  it("capitalizes artist names", () => {
    const result: RecommendResult = {
      artists: [makeArtist("iron maiden", 80)],
    };
    const text = formatShareText(result);
    expect(text).toContain("Iron Maiden");
  });
});

describe("buildShareUrl", () => {
  it("returns a valid t.me/share URL with url and text params", () => {
    const result: RecommendResult = {
      artists: [makeArtist("Test", 80)],
    };
    const url = buildShareUrl(result);
    expect(url).toMatch(/^https:\/\/t\.me\/share\/url\?url=/);
    expect(url).toContain("&text=");
    expect(url).toContain(encodeURIComponent("https://t.me/MusiGemBot"));
  });

  it("encodes text for URL", () => {
    const result: RecommendResult = {
      artists: [makeArtist("AC/DC", 90)],
    };
    const url = buildShareUrl(result);
    expect(url).not.toContain("\n");
    expect(url).toContain(encodeURIComponent("AC/DC"));
  });
});
