import { Scenes } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { escapeMarkdownV2 } from "../utils/markdown";
import { findByArtist } from "../api/music.api";
import { formatRecommendationHTML } from "../utils/formatedRecommendations";
import { notFoundSingleArtistMessage } from "../consts/errors";
import { isTimeoutError, getUserErrorMessage } from "../utils/errorHandler";
export const findByArtistScene = new Scenes.BaseScene<Scenes.SceneContext>(
  "find-by-artist",
);

findByArtistScene.enter(async (ctx) => {
  await ctx.reply(
    `*${escapeMarkdownV2("🎸 Артист")}*` +
      `\n\n${escapeMarkdownV2(
        "Напиши имя исполнителя или название группы в сообщениях — и я найду артистов, которые звучат максимально похоже.",
      )}` +
      `\n\n${escapeMarkdownV2("Например:")} _${escapeMarkdownV2("Rolling Stones")}_`,
    { parse_mode: "MarkdownV2" },
  );
});

findByArtistScene.on("text", async (ctx) => {
  const artistName = ctx.message.text.trim();

  if (!artistName) {
    await ctx.reply("⚠️ Введи имя артиста текстом");
    return;
  }

  await ctx.reply(
    `${escapeMarkdownV2("🔍 Ищу исполнителей, похожих на ")}*${escapeMarkdownV2(artistName)}*${escapeMarkdownV2("...")}`,
    { parse_mode: "MarkdownV2" },
  );

  try {
    const result = await findByArtist(artistName);

    if (!result.artists || result.artists.length === 0) {
      await ctx.reply(notFoundSingleArtistMessage, { 
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
    console.error("Error in findByArtist:", error);
    
    const errorMessage = getUserErrorMessage(error);
    if (errorMessage) {
      await ctx.reply(errorMessage, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...getStartInlineKeyboard(),
      });
    } else {
      await ctx.reply(notFoundSingleArtistMessage, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    }
  }

  await ctx.scene.leave();
});

findByArtistScene.leave(async (ctx) => {
  await ctx.reply("⬇️ Что будем делать дальше?", getStartInlineKeyboard());
});
