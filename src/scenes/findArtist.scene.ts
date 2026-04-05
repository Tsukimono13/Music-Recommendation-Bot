import { Scenes } from "telegraf";
import { getStartInlineKeyboard, getStartInlineKeyboardWithShare } from "../keyboards/start.keyboard";
import { getStartInlineKeyboardWithDeep } from "../keyboards/deep.keyboard";
import { buildShareUrl } from "../utils/shareText";
import { escapeMarkdownV2 } from "../utils/markdown";
import { recommend } from "../api/music.api";
import {
  formatRecommendationHTML,
  hasDeepDiveContent,
} from "../utils/formattedRecommendations";
import { notFoundRecommendationMessage } from "../consts/errors";
import { getUserErrorMessage, isTimeoutError } from "../utils/errorHandler";
import { logQuery } from "../modules/metrics/metrics.service";
import { checkRecommendLimit } from "../middlewares/recommendLimit";
import type { BotContext } from "../context/context";

export const findArtistScene = new Scenes.BaseScene<BotContext>(
  "find-artist",
);

findArtistScene.enter(async (ctx) => {
  await ctx.reply(
    `*${escapeMarkdownV2("🎸 Подобрать артистов")}*` +
      `\n\n${escapeMarkdownV2(
        "Напиши, какую музыку хочешь найти. Я подберу похожих исполнителей.",
      )}` +
      `\n\n${escapeMarkdownV2("Например:")}` +
      `\n${escapeMarkdownV2("• «Металлика и AC/DC»")}` +
      `\n${escapeMarkdownV2("• «Финский black metal»")}` +
      `\n${escapeMarkdownV2("• «Queen, но больше фанка»")}` +
      `\n${escapeMarkdownV2("• «Что-нибудь в духе Дэвида Боуи»")}` +
      `\n\n${escapeMarkdownV2("Можно смешивать артистов и теги в одном запросе. Лучше писать кратко. В запросе можно указать максимум 3 артиста и 5 тегов.")}` +
      `\n\n_${escapeMarkdownV2("Теги – это музыкальные категории, которыми описывают музыку: жанры (techno, synthpop), страны (finnish metal), эпохи (80s).")}_`,
    { parse_mode: "MarkdownV2" },
  );
});

findArtistScene.on("text", async (ctx) => {
  const message = ctx.message.text.trim();
  if (!message) {
    await ctx.reply("⚠️ Напиши, что ищешь");
    return;
  }

  const userId = ctx.from?.id;
  if (userId) {
    const limitResult = checkRecommendLimit(userId);
    if (limitResult !== true) {
      await ctx.reply(
        `⏳ Подожди ${limitResult} сек. перед следующим запросом.`,
      );
      await ctx.scene.leave();
      return;
    }
  }

  await ctx.reply(
    `${escapeMarkdownV2("🔍 Уже ищу похожих исполнителей")}\n${escapeMarkdownV2("Это может занять до 40 секунд.")}`,
    {
      parse_mode: "MarkdownV2",
    },
  );

  const startTime = Date.now();
  try {
    const result = await recommend(message);
    const responseMs = Date.now() - startTime;
    const resultCount = (result.artists?.length ?? 0) + (result.fallbackArtists?.length ?? 0);
    const hasAny =
      (result.artists && result.artists.length > 0) ||
      (result.fallbackArtists && result.fallbackArtists.length > 0) ||
      (result.tags && result.tags.length > 0);

    logQuery({ query: message, resultCount, responseMs, timestamp: new Date().toISOString(), source: "chat" });

    ctx.session.lastRecommendResult = undefined;

    if (!hasAny) {
      await ctx.reply(notFoundRecommendationMessage, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    } else {
      let warningText = "";
      const notFoundArtists = result.notFoundArtists || [];
      const notFoundTags = result.notFoundTags || [];
      if (notFoundArtists.length > 0 || notFoundTags.length > 0) {
        warningText =
          "✴️ <b>Обрати внимание:</b> не всё из запроса нашлось в базе. Результат без учёта недоступного.\n\n";
      }
      const recommendationText = formatRecommendationHTML(result);
      await ctx.reply(warningText + recommendationText, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
      ctx.session.lastRecommendResult = result;
      ctx.session.deepDiveOffset = 0;
    }
  } catch (e: unknown) {
    const responseMs = Date.now() - startTime;
    const errorType = isTimeoutError(e) ? "timeout" : "error";
    logQuery({ query: message, resultCount: 0, responseMs, error: errorType, timestamp: new Date().toISOString(), source: "chat" });

    ctx.session.lastRecommendResult = undefined;
    ctx.session.deepDiveOffset = undefined;
    console.error("Error in findArtist:", e);
    const errorMessage = getUserErrorMessage(e);
    if (errorMessage) {
      await ctx.reply(errorMessage, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...getStartInlineKeyboard(),
      });
    } else {
      await ctx.reply(notFoundRecommendationMessage, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    }
  }
  await ctx.scene.leave();
});

findArtistScene.leave(async (ctx) => {
  const result = ctx.session?.lastRecommendResult;
  const hasDeep = result && hasDeepDiveContent(result);
  const shareUrl = result ? buildShareUrl(result) : undefined;

  let keyboard;
  if (hasDeep) {
    keyboard = getStartInlineKeyboardWithDeep(shareUrl);
  } else if (shareUrl) {
    keyboard = getStartInlineKeyboardWithShare(shareUrl);
  } else {
    keyboard = getStartInlineKeyboard();
  }

  await ctx.reply("⬇️ Что будем делать дальше?", keyboard);
});
