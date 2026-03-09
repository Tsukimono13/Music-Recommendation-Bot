import { Scenes } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { getStartInlineKeyboardWithDeep } from "../keyboards/deep.keyboard";
import { escapeMarkdownV2 } from "../utils/markdown";
import { recommend } from "../api/music.api";
import {
  formatRecommendationHTML,
  hasDeepDiveContent,
  type RecommendResult,
} from "../utils/formatedRecommendations";
import { notFoundRecommendationMessage } from "../consts/errors";
import { getUserErrorMessage } from "../utils/errorHandler";

export const findArtistScene = new Scenes.BaseScene<Scenes.SceneContext>(
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

  await ctx.reply(`${escapeMarkdownV2("🔍 Уже ищу похожих исполнителей")}`, {
    parse_mode: "MarkdownV2",
  });

  try {
    const result = await recommend(message);
    const hasAny =
      (result.artists && result.artists.length > 0) ||
      (result.fallbackArtists && result.fallbackArtists.length > 0) ||
      (result.tags && result.tags.length > 0);

    const session = ctx.session as { lastRecommendResult?: RecommendResult } | undefined;
    if (session) session.lastRecommendResult = undefined;

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
      if (session) session.lastRecommendResult = result as RecommendResult;
    }
  } catch (e: unknown) {
    const session = ctx.session as { lastRecommendResult?: RecommendResult } | undefined;
    if (session) session.lastRecommendResult = undefined;
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
  const session = ctx.session as { lastRecommendResult?: RecommendResult } | undefined;
  const hasDeep = session?.lastRecommendResult && hasDeepDiveContent(session.lastRecommendResult);
  await ctx.reply(
    "⬇️ Что будем делать дальше?",
    hasDeep ? getStartInlineKeyboardWithDeep() : getStartInlineKeyboard(),
  );
});
