import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { FAQ_TEXT } from "../consts/faq";

export function registerFaqActions(bot: any) {
  bot.action("FAQ", async (ctx: any) => {
    await ctx.answerCbQuery();
    await ctx.reply(FAQ_TEXT, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...getStartInlineKeyboard(),
    });
  });
}
