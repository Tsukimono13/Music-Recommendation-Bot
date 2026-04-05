import { Telegraf } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { ABOUT_TEXT } from "../consts/about";
import type { BotContext } from "../context/context";

export function registerAboutActions(bot: Telegraf<BotContext>) {
  bot.action("ABOUT", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(ABOUT_TEXT.trim(), {
      parse_mode: "HTML",
      ...getStartInlineKeyboard(),
    });
  });
}
