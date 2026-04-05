import { describe, it, expect } from "vitest";
import {
  formatRecommendationHTML,
  hasDeepDiveContent,
  formatDeepDiveHTMLPaginated,
  type RecommendResult,
} from "./formattedRecommendations";

function makeArtist(name: string, score: number, spotifyUrl?: string) {
  return { artist: name, score, ...(spotifyUrl ? { spotifyUrl } : {}) };
}

describe("formatRecommendationHTML", () => {
  it("shows tiers split by score", () => {
    const result: RecommendResult = {
      artists: [
        makeArtist("Megadeth", 95),
        makeArtist("Anthrax", 60),
        makeArtist("Exodus", 40),
      ],
    };
    const html = formatRecommendationHTML(result);
    expect(html).toContain("💎 Максимально близкие");
    expect(html).toContain("Megadeth — 95%");
    expect(html).toContain("🔥 Очень похожие");
    expect(html).toContain("Anthrax — 60%");
    expect(html).toContain("❇️ Возможно, также понравятся");
    expect(html).toContain("Exodus");
  });

  it("renders Spotify links as HTML anchors", () => {
    const result: RecommendResult = {
      artists: [makeArtist("Metallica", 100, "https://open.spotify.com/artist/123")],
    };
    const html = formatRecommendationHTML(result);
    expect(html).toContain('<a href="https://open.spotify.com/artist/123">Metallica</a>');
  });

  it("shows fallback message when no artists found", () => {
    const result: RecommendResult = {
      artists: [],
      fallbackArtists: [makeArtist("Fallback Band", 0)],
    };
    const html = formatRecommendationHTML(result);
    expect(html).toContain("мало общего");
    expect(html).toContain("Fallback Band");
  });

  it("shows tags limited to 3", () => {
    const result: RecommendResult = {
      artists: [makeArtist("Band", 80)],
      tags: ["rock", "metal", "grunge", "alternative"],
    };
    const html = formatRecommendationHTML(result);
    expect(html).toContain("Rock, Metal, Grunge");
    expect(html).not.toContain("Alternative");
  });

  it("filters out empty artist names", () => {
    const result: RecommendResult = {
      artists: [makeArtist("", 90), makeArtist("  ", 80), makeArtist("Real", 70)],
    };
    const html = formatRecommendationHTML(result);
    expect(html).not.toContain("💎 Максимально близкие");
    expect(html).toContain("Real");
  });

  it("shows custom title with user artists and tags", () => {
    const result: RecommendResult = {
      artists: [makeArtist("Result", 80)],
    };
    const html = formatRecommendationHTML(result, {
      customTitle: "custom",
      userArtists: ["metallica"],
      userTags: ["thrash metal"],
    });
    expect(html).toContain("Твой выбор:");
    expect(html).toContain("Metallica");
    expect(html).toContain("Thrash Metal");
  });

  it("includes powered-by footer", () => {
    const result: RecommendResult = { artists: [makeArtist("X", 80)] };
    const html = formatRecommendationHTML(result);
    expect(html).toContain("Powered by");
    expect(html).toContain("MusicBrainz");
  });

  it("shows Spotify unavailable hint when no links present", () => {
    const result: RecommendResult = {
      artists: [makeArtist("Band A", 90), makeArtist("Band B", 60)],
    };
    const html = formatRecommendationHTML(result);
    expect(html).toContain("Ссылки на Spotify временно недоступны");
  });

  it("does not show Spotify hint when links are present", () => {
    const result: RecommendResult = {
      artists: [makeArtist("Band", 90, "https://open.spotify.com/artist/123")],
    };
    const html = formatRecommendationHTML(result);
    expect(html).not.toContain("Ссылки на Spotify временно недоступны");
  });
});

describe("hasDeepDiveContent", () => {
  it("returns false when all artists fit in main tiers", () => {
    // 3 close + 4 similar + 10 maybe = 17 total fits without remaining
    const artists = [
      ...Array.from({ length: 3 }, (_, i) => makeArtist(`C${i}`, 80)),
      ...Array.from({ length: 4 }, (_, i) => makeArtist(`S${i}`, 60)),
      ...Array.from({ length: 10 }, (_, i) => makeArtist(`M${i}`, 30)),
    ];
    expect(hasDeepDiveContent({ artists })).toBe(false);
  });

  it("returns true when there are remaining artists", () => {
    const artists = [
      ...Array.from({ length: 3 }, (_, i) => makeArtist(`C${i}`, 80)),
      ...Array.from({ length: 4 }, (_, i) => makeArtist(`S${i}`, 60)),
      ...Array.from({ length: 11 }, (_, i) => makeArtist(`M${i}`, 30)),
    ];
    expect(hasDeepDiveContent({ artists })).toBe(true);
  });

  it("returns true when tags exceed 3", () => {
    const result: RecommendResult = {
      artists: [makeArtist("X", 80)],
      tags: ["a", "b", "c", "d"],
    };
    expect(hasDeepDiveContent(result)).toBe(true);
  });

  it("returns false with 3 or fewer tags and no remaining", () => {
    const result: RecommendResult = {
      artists: [makeArtist("X", 80)],
      tags: ["a", "b", "c"],
    };
    expect(hasDeepDiveContent(result)).toBe(false);
  });
});

describe("formatDeepDiveHTMLPaginated", () => {
  // Build a result with enough artists to have remaining (>17 total)
  const artists = [
    ...Array.from({ length: 3 }, (_, i) => makeArtist(`Close${i}`, 80)),
    ...Array.from({ length: 4 }, (_, i) => makeArtist(`Similar${i}`, 60)),
    ...Array.from({ length: 10 }, (_, i) => makeArtist(`Maybe${i}`, 30)),
    ...Array.from({ length: 12 }, (_, i) => makeArtist(`Extra${i}`, 20)),
  ];
  const result: RecommendResult = {
    artists,
    tags: ["rock", "metal", "grunge", "punk", "alternative"],
  };

  it("returns first page of remaining artists", () => {
    const { text, hasMore } = formatDeepDiveHTMLPaginated(result, {
      offset: 0,
      limit: 9,
    });
    expect(text).toContain("Extra0");
    expect(text).toContain("Extra8");
    expect(hasMore).toBe(true);
  });

  it("returns second page with hasMore false", () => {
    const { text, hasMore } = formatDeepDiveHTMLPaginated(result, {
      offset: 9,
      limit: 9,
    });
    expect(text).toContain("Extra9");
    expect(hasMore).toBe(false);
  });

  it("shows tags only on first page", () => {
    const { text: page1 } = formatDeepDiveHTMLPaginated(result, {
      offset: 0,
      limit: 9,
    });
    const { text: page2 } = formatDeepDiveHTMLPaginated(result, {
      offset: 9,
      limit: 9,
    });
    expect(page1).toContain("Связанные теги");
    expect(page2).not.toContain("Связанные теги");
  });
});
