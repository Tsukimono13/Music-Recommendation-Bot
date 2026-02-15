import { Composer } from "telegraf";
import { BotContext } from "../context/context";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { escapeMarkdownV2 } from "../utils/markdown";

export const unknownMessageMiddleware = new Composer<BotContext>();

unknownMessageMiddleware.on("text", async (ctx) => {
  if (ctx.scene?.current) {
    return;
  }

  if (ctx.message.text?.startsWith("/")) {
    return;
  }

  await ctx.reply(
    `*🤔 Кажется, я не понял, что с этим делать\\.*` +
      `\n\n${escapeMarkdownV2("Выбери действие с помощью кнопок ниже — и продолжим. ⬇️")}`,
    { parse_mode: "MarkdownV2", ...getStartInlineKeyboard() },
  );
});
