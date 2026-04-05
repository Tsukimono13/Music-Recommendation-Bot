import { capitalizeWords } from "./capitalize";
import type { RecommendResult } from "./formattedRecommendations";

const BOT_USERNAME = "MusiGemBot";

export function formatShareText(result: RecommendResult): string {
  const validArtists = (result.artists || []).filter(
    (a) => a.artist && a.artist.trim() !== "",
  );

  const lines: string[] = [];

  lines.push("Мне подобрали музыку в @" + BOT_USERNAME + ":\n");

  const close = validArtists.filter((a) => a.score >= 75).slice(0, 3);
  const similar = validArtists
    .filter((a) => a.score >= 55 && a.score < 75)
    .slice(0, 4);
  const maybe = validArtists
    .filter((a) => a.score < 55)
    .slice(0, 5);

  if (close.length) {
    lines.push(
      "💎 " +
        close.map((a) => `${capitalizeWords(a.artist)} — ${a.score}%`).join(", "),
    );
  }

  if (similar.length) {
    lines.push(
      "🔥 " +
        similar
          .map((a) => `${capitalizeWords(a.artist)} — ${a.score}%`)
          .join(", "),
    );
  }

  if (maybe.length) {
    lines.push(
      "❇️ " + maybe.map((a) => capitalizeWords(a.artist)).join(", "),
    );
  }

  if (!close.length && !similar.length && !maybe.length) {
    const fallback = (result.fallbackArtists || []).slice(0, 5);
    if (fallback.length) {
      lines.push(fallback.map((a) => capitalizeWords(a.artist)).join(", "));
    }
  }

  lines.push("\nПопробуй тоже → t.me/" + BOT_USERNAME);

  return lines.join("\n");
}

export function buildShareUrl(result: RecommendResult): string {
  const text = formatShareText(result);
  const botUrl = "https://t.me/" + BOT_USERNAME;
  return "https://t.me/share/url?url=" + encodeURIComponent(botUrl) + "&text=" + encodeURIComponent(text);
}
