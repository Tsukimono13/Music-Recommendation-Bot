import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import { ABOUT_TEXT } from "../consts/about";

export function registerAboutActions(bot: any) {
  bot.action("ABOUT", async (ctx: any) => {
    await ctx.answerCbQuery();
    await ctx.reply(ABOUT_TEXT.trim(), {
      parse_mode: "HTML",
      ...getStartInlineKeyboard(),
    });
  });
}
