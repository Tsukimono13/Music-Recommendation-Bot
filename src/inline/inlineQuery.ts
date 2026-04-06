import { Telegraf } from "telegraf";
import type { BotContext } from "../context/context";
import type {
  InlineQueryResultArticle,
  InputTextMessageContent,
} from "telegraf/types";
import { recommend } from "../api/music.api";
import { capitalizeWords } from "../utils/capitalize";
import { logQuery } from "../modules/metrics/metrics.service";
import type { RecommendResult } from "../utils/formattedRecommendations";

const INLINE_TIMEOUT = 12_000;
const BOT_USERNAME = "musigem_bot";

function formatInlineHTML(result: RecommendResult): string {
  const artists = (result.artists || []).filter(
    (a) => a.artist && a.artist.trim() !== "",
  );

  const close = artists.filter((a) => a.score >= 75).slice(0, 3);
  const similar = artists.filter((a) => a.score >= 55 && a.score < 75).slice(0, 4);
  const maybe = artists.filter((a) => a.score < 55).slice(0, 5);

  const lines: string[] = [];

  if (close.length) {
    lines.push(
      "<b>💎 Максимально близкие:</b>",
      ...close.map(
        (a) =>
          a.spotifyUrl
            ? `<a href="${a.spotifyUrl}">${capitalizeWords(a.artist)}</a> — ${a.score}%`
            : `${capitalizeWords(a.artist)} — ${a.score}%`,
      ),
      "",
    );
  }

  if (similar.length) {
    lines.push(
      "<b>🔥 Очень похожие:</b>",
      ...similar.map(
        (a) =>
          a.spotifyUrl
            ? `<a href="${a.spotifyUrl}">${capitalizeWords(a.artist)}</a> — ${a.score}%`
            : `${capitalizeWords(a.artist)} — ${a.score}%`,
      ),
      "",
    );
  }

  if (maybe.length) {
    lines.push(
      "<b>❇️ Возможно, также понравятся:</b>",
      maybe
        .map((a) =>
          a.spotifyUrl
            ? `<a href="${a.spotifyUrl}">${capitalizeWords(a.artist)}</a>`
            : capitalizeWords(a.artist),
        )
        .join(", "),
      "",
    );
  }

  if (!close.length && !similar.length && !maybe.length) {
    const fallback = (result.fallbackArtists || []).slice(0, 5);
    if (fallback.length) {
      lines.push(
        "<b>❇️ Возможно, понравятся:</b>",
        fallback.map((a) => capitalizeWords(a.artist)).join(", "),
        "",
      );
    }
  }

  lines.push(
    `<i>Найдено с помощью @${BOT_USERNAME}</i>`,
  );

  return lines.join("\n");
}

function descriptionFromResult(result: RecommendResult): string {
  const names = (result.artists || [])
    .filter((a) => a.artist && a.artist.trim() !== "")
    .slice(0, 5)
    .map((a) => capitalizeWords(a.artist));
  return names.join(", ") || "Рекомендации";
}

export function registerInlineQuery(bot: Telegraf<BotContext>) {
  bot.on("inline_query", async (ctx) => {
    const query = ctx.inlineQuery.query.trim();

    if (!query || query.length < 2) {
      await ctx.answerInlineQuery([], {
        cache_time: 1,
        button: {
          text: "Введи артиста или жанр...",
          start_parameter: "inline",
        },
      });
      return;
    }

    const startTime = Date.now();
    try {
      const result = await Promise.race([
        recommend(query),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("inline_timeout")), INLINE_TIMEOUT),
        ),
      ]);
      const responseMs = Date.now() - startTime;

      if (!result) {
        await answerWithFallback(ctx, query);
        return;
      }

      const resultCount = (result.artists?.length ?? 0) + (result.fallbackArtists?.length ?? 0);
      logQuery({ query, resultCount, responseMs, timestamp: new Date().toISOString(), source: "inline" });

      const hasAny =
        (result.artists?.length > 0) ||
        (result.fallbackArtists?.length > 0);

      if (!hasAny) {
        await ctx.answerInlineQuery(
          [
            {
              type: "article",
              id: "no_results",
              title: "Ничего не найдено",
              description: "Попробуй другой запрос",
              input_message_content: {
                message_text: `Не нашёл рекомендаций по запросу «${query}».\nПопробуй в @${BOT_USERNAME} — там больше возможностей!`,
                parse_mode: "HTML",
              } as InputTextMessageContent,
            } as InlineQueryResultArticle,
          ],
          { cache_time: 30, is_personal: true },
        );
        return;
      }

      const html = formatInlineHTML(result);
      const description = descriptionFromResult(result);

      await ctx.answerInlineQuery(
        [
          {
            type: "article",
            id: "rec_" + Date.now(),
            title: `🎸 Рекомендации: ${query}`,
            description,
            input_message_content: {
              message_text: html,
              parse_mode: "HTML",
              link_preview_options: { is_disabled: true },
            } as InputTextMessageContent,
          } as InlineQueryResultArticle,
        ],
        { cache_time: 300, is_personal: false },
      );
    } catch (e) {
      const responseMs = Date.now() - startTime;
      const errorType = e instanceof Error && e.message === "inline_timeout" ? "timeout" : "error";
      logQuery({ query, resultCount: 0, responseMs, error: errorType, timestamp: new Date().toISOString(), source: "inline" });
      await answerWithFallback(ctx, query);
    }
  });
}

async function answerWithFallback(ctx: any, query: string) {
  await ctx.answerInlineQuery(
    [
      {
        type: "article",
        id: "fallback",
        title: `🎸 Найти похожих на «${query}»`,
        description: "Нажми, чтобы открыть бота и получить результат",
        input_message_content: {
          message_text: `Ищу музыку похожую на «${query}»...\nПопробуй сам → @${BOT_USERNAME}`,
          parse_mode: "HTML",
        } as InputTextMessageContent,
      } as InlineQueryResultArticle,
    ],
    {
      cache_time: 5,
      is_personal: true,
      button: {
        text: `Открыть @${BOT_USERNAME}`,
        start_parameter: "inline",
      },
    },
  );
}
