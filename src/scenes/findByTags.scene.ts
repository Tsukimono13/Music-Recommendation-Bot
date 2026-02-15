import { Scenes } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { escapeMarkdownV2 } from "../utils/markdown";
import { findByTags } from "../api/music.api";
import { formatRecommendationHTML } from "../utils/formatedRecommendations";
import { notFoundArtistsByTags } from "../consts/errors";
import { getUserErrorMessage } from "../utils/errorHandler";

export const findByTagsScene = new Scenes.BaseScene<Scenes.SceneContext>(
  "find-by-tags",
);

findByTagsScene.enter(async (ctx) => {
  await ctx.reply(
    `*${escapeMarkdownV2("#️⃣ Тэги")}*` +
      `\n\n${escapeMarkdownV2(
        "Напиши через запятую тэги на английском языке — я найду артистов, максимально совпадающих с твоим запросом. Тэги могут обозначать жанры, страны, музыкальные десятилетия и т. д.",
      )}` +
      `\n\n${escapeMarkdownV2("Например:")} _${escapeMarkdownV2("Rock, 80s, Japanese Rock")}_`,
    { parse_mode: "MarkdownV2" },
  );
});

findByTagsScene.on("text", async (ctx) => {
  const tags = ctx.message.text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  const tagsBold = tags
    .map((t) => `*${escapeMarkdownV2(t)}*`)
    .join(escapeMarkdownV2(", "));

  if (!tags.length) {
    await ctx.reply("⚠️ Введи тэги текстом");
    return;
  }

  await ctx.reply(
    `${escapeMarkdownV2("🔍 Ищу исполнителей, соответствующих ")}${tagsBold}${escapeMarkdownV2("...")}`,
    { parse_mode: "MarkdownV2" },
  );

  try {
    const result = await findByTags(tags);

    const hasAnyData =
      (result.artists && result.artists.length > 0) ||
      (result.fallbackArtists && result.fallbackArtists.length > 0) ||
      (result.tags && result.tags.length > 0);

    if (!hasAnyData) {
      await ctx.reply(notFoundArtistsByTags, { 
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
    console.error("Error in findByTags:", error);
    
    const errorMessage = getUserErrorMessage(error);
    if (errorMessage) {
      await ctx.reply(errorMessage, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...getStartInlineKeyboard(),
      });
    } else {
      await ctx.reply(notFoundArtistsByTags, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    }
  }

  await ctx.scene.leave();
});

findByTagsScene.leave(async (ctx) => {
  await ctx.reply("⬇️ Что будем делать дальше?", getStartInlineKeyboard());
});
