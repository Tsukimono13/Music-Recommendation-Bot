import { Scenes } from "telegraf";
import { escapeMarkdownV2 } from "../utils/markdown";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { recommend } from "../api/music.api";
import { formatRecommendationHTML } from "../utils/formatedRecommendations";
import { notFoundRecommendationMessage } from "../consts/errors";
import { getUserErrorMessage } from "../utils/errorHandler";

export const findBetweenArtistsScene =
  new Scenes.BaseScene<Scenes.SceneContext>("find-by-artist+artist");

findBetweenArtistsScene.enter(async (ctx) => {
  await ctx.reply(
    `*${escapeMarkdownV2("🎷🎻 Артисты")}*` +
      `\n\n${escapeMarkdownV2(
        "Опиши, что ищешь: несколько артистов или жанр — я подберу похожих.",
      )}` +
      `\n\n${escapeMarkdownV2("Например:")} _${escapeMarkdownV2("хочу группы как Children of Bodom и Slayer с пауэр-металом")}_`,
    { parse_mode: "MarkdownV2" },
  );
});

findBetweenArtistsScene.on("text", async (ctx) => {
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
      await ctx.reply(formatRecommendationHTML(result), {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    }
  } catch (error: any) {
    console.error("Error in findBetweenArtists:", error);
    const errorMessage = getUserErrorMessage(error);
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

findBetweenArtistsScene.leave(async (ctx) => {
  await ctx.reply("⬇️ Что будем делать дальше?", getStartInlineKeyboard());
});
