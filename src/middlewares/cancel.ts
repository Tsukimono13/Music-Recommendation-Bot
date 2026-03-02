import { Composer, Markup } from "telegraf";
import { BotContext } from "../context/context";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";

export const cancelMiddleware = new Composer<BotContext>();

cancelMiddleware.hears("❌ Отмена", async (ctx) => {
  if (ctx.scene?.current) {
    await ctx.scene.leave();
  }
  try {
    const rm = await ctx.reply(".", Markup.removeKeyboard());
    try {
      await ctx.deleteMessage(rm.message_id);
    } catch {
      // ignore
    }
  } catch (e) {
    console.error("Failed to remove keyboard in cancel:", e);
  }
  await ctx.reply("", getStartInlineKeyboard());
});

cancelMiddleware.action("CANCEL", async (ctx) => {
  await ctx.answerCbQuery();
  if (ctx.scene?.current) {
    await ctx.scene.leave();
  }

  if (ctx.callbackQuery?.message && "message_id" in ctx.callbackQuery.message) {
    try {
      await ctx.editMessageReplyMarkup(getStartInlineKeyboard().reply_markup);
    } catch (error) {
      await ctx.reply("✅", getStartInlineKeyboard());
    }
  } else {
    await ctx.reply("✅", getStartInlineKeyboard());
  }
});