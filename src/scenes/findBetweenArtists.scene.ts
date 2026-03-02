import { Scenes } from "telegraf";
import { escapeMarkdownV2 } from "../utils/markdown";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { findBetweenArtists } from "../api/music.api";
import { formatRecommendationHTML } from "../utils/formatedRecommendations";
import { notFoundMultipleArtistsMessage } from "../consts/errors";
import { getUserErrorMessage } from "../utils/errorHandler";

export const findBetweenArtistsScene =
  new Scenes.BaseScene<Scenes.SceneContext>("find-by-artist+artist");

findBetweenArtistsScene.enter(async (ctx) => {
  await ctx.reply(
    `*${escapeMarkdownV2("🎸🎻 Артисты")}*` +
      `\n\n${escapeMarkdownV2(
        "Напиши через запятую имена исполнителей или названия групп — и я найду артистов, которые звучат максимально похоже.",
      )}` +
      `\n\n${escapeMarkdownV2("Перед отправкой сообщения проверь, что имя артиста или тэг написаны верно — это поможет найти более точные совпадения.")}` +
      `\n\n${escapeMarkdownV2("Например:")} _${escapeMarkdownV2("Rolling Stones, Madonna")}_`,
    { parse_mode: "MarkdownV2" },
  );
});

findBetweenArtistsScene.on("text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (!text) {
    await ctx.reply("⚠️ Введи имена артистов текстом");
    return;
  }

  const artistNames = text
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

  await ctx.reply(
    `${escapeMarkdownV2("🔍 Ищу исполнителей, похожих на ")}*${artistNames
      .map(escapeMarkdownV2)
      .join(", ")}*${escapeMarkdownV2("...")}`,
    { parse_mode: "MarkdownV2" },
  );

  try {
    const result = await findBetweenArtists(artistNames);

    const hasAnyData =
      (result.artists && result.artists.length > 0) ||
      (result.fallbackArtists && result.fallbackArtists.length > 0) ||
      (result.tags && result.tags.length > 0);

    if (!hasAnyData) {
      await ctx.reply(notFoundMultipleArtistsMessage, {
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
      await ctx.reply(notFoundMultipleArtistsMessage, {
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
