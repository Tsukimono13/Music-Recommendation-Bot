import { Telegraf } from "telegraf";
import type { BotContext } from "../context/context";

export function registerFeedbackActions(bot: Telegraf<BotContext>) {
  bot.action("FEEDBACK", async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.scene.enter("feedback");
    } catch (err) {
      console.error("FEEDBACK action error:", err);
      try {
        await ctx.answerCbQuery().catch(() => {});
      } catch {
        // ignore
      }
    }
  });
}
