import { Scenes } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { getSupportInlineKeyboard } from "../keyboards/support.keyboard";
import { escapeMarkdownV2 } from "../utils/markdown";

export const supportScene = new Scenes.BaseScene<Scenes.SceneContext>(
  "support",
);

supportScene.enter(async (ctx) => {
  await ctx.reply(
    `*${escapeMarkdownV2("🍩 Поддержать нас")}*` +
      `\n\n${escapeMarkdownV2(
        "Ваша поддержка очень ценна для нас! Она мотивирует развивать MusiGem и радовать вас новыми функциями.",
      )}`,
    { parse_mode: "MarkdownV2", ...getSupportInlineKeyboard() },
  );
});

supportScene.leave(async (ctx) => {
  await ctx.reply("⬇️ Что будем делать дальше?", getStartInlineKeyboard());
});
