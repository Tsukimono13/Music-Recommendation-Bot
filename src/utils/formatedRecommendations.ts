import { capitalizeWords } from "./capitalize";

const maxClose = 3;
const maxSimilar = 4;
const maxMaybe = 10;
const maxTags = 3;

export type RecommendResult = {
  artists: { artist: string; score: number; spotifyUrl?: string }[];
  fallbackArtists?: { artist: string; spotifyUrl?: string }[];
  tags?: string[];
};

function formatArtistLink(name: string, url?: string): string {
  const title = capitalizeWords(name);
  return url ? `<a href="${url}">${title}</a>` : title;
}

function splitArtists(
  validArtists: { artist: string; score: number; spotifyUrl?: string }[],
) {
  const close: typeof validArtists = [];
  const similar: typeof validArtists = [];
  const maybe: typeof validArtists = [];
  const remaining: typeof validArtists = [];

  for (const a of validArtists) {
    if (a.score >= 75 && close.length < maxClose) close.push(a);
    else if (a.score >= 55 && a.score < 75 && similar.length < maxSimilar)
      similar.push(a);
    else if (maybe.length < maxMaybe) maybe.push(a);
    else remaining.push(a);
  }
  return { close, similar, maybe, remaining };
}

export function hasDeepDiveContent(result: RecommendResult): boolean {
  const validArtists = (result.artists || []).filter(
    (a) => a.artist && a.artist.trim() !== "",
  );
  const { remaining } = splitArtists(validArtists);
  const validTags = (result.tags || []).filter((t) => t && t.trim() !== "");
  return remaining.length > 0 || validTags.length > maxTags;
}

export function formatDeepDiveHTML(result: RecommendResult): string {
  const validArtists = (result.artists || []).filter(
    (a) => a.artist && a.artist.trim() !== "",
  );
  const { remaining } = splitArtists(validArtists);
  const validTags = (result.tags || []).filter((t) => t && t.trim() !== "");

  let text = "💠 <b>Нашел больше редких алмазов:</b>\n\n";
  if (remaining.length > 0) {
    text += remaining
      .map((a) => formatArtistLink(a.artist, a.spotifyUrl))
      .join(", ");
    text += "\n\n";
  }
  if (validTags.length > 0) {
    text +=
      "<b># Связанные теги:</b>\n" +
      validTags.map(capitalizeWords).join(", ") +
      "\n\n";
  }
  text += "<i>Powered by Last\u200B.fm, Gemini, Spotify.\nData from MusicBrainz (CC-BY-SA).</i>";
  return text;
}

export function formatRecommendationHTML(
  result: RecommendResult,
  options?: {
    customTitle?: string;
    userArtists?: string[];
    userTags?: string[];
  },
): string {
  const validArtists = (result.artists || []).filter(
    (a) => a.artist && a.artist.trim() !== "",
  );

  const hasArtists = validArtists.length > 0;

  const { close, similar, maybe } = splitArtists(validArtists);

  const validTags = (result.tags || [])
    .filter((t) => t && t.trim() !== "")
    .slice(0, maxTags);

  let text = "";

  // ❌ Нет пересечений
  if (!hasArtists) {
    text = "😳 <b>Похоже, у этих исполнителей мало общего.</b>\n\n";

    if (result.fallbackArtists?.length) {
      text +=
        "❇️ <b>Возможно, также понравятся:</b>\n" +
        result.fallbackArtists
          .slice(0, maxMaybe)
          .map((a) => formatArtistLink(a.artist, a.spotifyUrl))
          .join(", ") +
        "\n\n";
    }

    if (validTags.length) {
      text +=
        "<b># Связанные тэги:</b>\n" +
        validTags.map(capitalizeWords).join(", ") +
        "\n\n";
    }

    text +=
      "<i>Powered by Last\u200B.fm, Gemini, Spotify.\nData from MusicBrainz (CC-BY-SA).</i>";

    return text;
  }

  // ✅ Есть результаты
  if (options?.customTitle && options.userArtists && options.userTags) {
    text = "<b>Твой выбор:</b>\n";

    const userArtistsFormatted = options.userArtists
      .map((a) => capitalizeWords(a))
      .join(", ");

    const userTagsFormatted = options.userTags
      .map((t) => capitalizeWords(t))
      .join(", ");

    text += `Стиль: ${userArtistsFormatted}\n`;
    text += `В сочетании с: ${userTagsFormatted}\n\n`;
  } else {
    text = "<b>Отличный выбор!</b>\n\n";
  }

  // 💎 Максимально близкие
  if (close.length) {
    text += "<b>💎 Максимально близкие:</b>\n";
    text +=
      close
        .map((a) => `${formatArtistLink(a.artist, a.spotifyUrl)} — ${a.score}%`)
        .join("\n") + "\n\n";
  }

  // 🔥 Очень похожие
  if (similar.length) {
    text += "<b>🔥 Очень похожие:</b>\n";
    text +=
      similar
        .map((a) => `${formatArtistLink(a.artist, a.spotifyUrl)} — ${a.score}%`)
        .join("\n") + "\n\n";
  }

  // ❇️ Возможно понравятся
  if (maybe.length) {
    text += "<b>❇️ Возможно, также понравятся:</b>\n";
    text +=
      maybe.map((a) => formatArtistLink(a.artist, a.spotifyUrl)).join(", ") +
      "\n\n";
  }

  // 🏷 Теги
  if (validTags.length) {
    text += `<b># Связанные тэги:</b>\n${validTags
      .map(capitalizeWords)
      .join(", ")}\n\n`;
  }

  text +=
    "<i>Powered by Last\u200B.fm, Gemini, Spotify.\nData from MusicBrainz (CC-BY-SA).</i>";

  return text;
}
