import { Scenes } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { escapeMarkdownV2 } from "../utils/markdown";
import { recommend } from "../api/music.api";
import { formatRecommendationHTML } from "../utils/formatedRecommendations";
import { notFoundRecommendationMessage } from "../consts/errors";
import { getUserErrorMessage } from "../utils/errorHandler";

export const findByArtistTagScene = new Scenes.BaseScene<Scenes.SceneContext>(
  "find-by-artist+tags",
);

findByArtistTagScene.enter(async (ctx) => {
  await ctx.reply(
    `*${escapeMarkdownV2("🥁 Артисты+Тэги")}*` +
      `\n\n${escapeMarkdownV2(
        "Опиши одним сообщением: каких артистов или жанр хочешь. Бэкенд сам поймёт артистов и тэги.",
      )}` +
      `\n\n${escapeMarkdownV2("Например:")} _${escapeMarkdownV2(
        "Хочу группы как Children of Bodom и Slayer, но с пауэр-металом",
      )}_`,
    { parse_mode: "MarkdownV2" },
  );
});

findByArtistTagScene.on("text", async (ctx) => {
  const message = ctx.message.text.trim();
  if (!message) {
    await ctx.reply("⚠️ Напиши, что ищешь");
    return;
  }

  await ctx.reply(
    `${escapeMarkdownV2("🔍 Ищу рекомендации...")}`,
    { parse_mode: "MarkdownV2" },
  );

  try {
    const result = await recommend(message);
    const hasAny =
      (result.artists && result.artists.length > 0) ||
      (result.fallbackArtists && result.fallbackArtists.length > 0) ||
      (result.tags && result.tags.length > 0);

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
        warningText = "✴️ <b>Обрати внимание:</b> не всё из запроса нашлось в базе. Результат без учёта недоступного.\n\n";
      }
      const recommendationText = formatRecommendationHTML(result);
      await ctx.reply(warningText + recommendationText, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    }
  } catch (e: any) {
    console.error("Error in findByArtistTag:", e);
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

findByArtistTagScene.leave(async (ctx) => {
  await ctx.reply("⬇️ Что будем делать дальше?", getStartInlineKeyboard());
});
