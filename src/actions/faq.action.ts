import { Telegraf } from "telegraf";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { FAQ_TEXT } from "../consts/faq";
import type { BotContext } from "../context/context";

export function registerFaqActions(bot: Telegraf<BotContext>) {
  bot.action("FAQ", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(FAQ_TEXT, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...getStartInlineKeyboard(),
    });
  });
}
