import { Composer } from "telegraf";
import { BotContext } from "../context/context";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";

export const cancelMiddleware = new Composer<BotContext>();

cancelMiddleware.hears("❌ Отмена", async (ctx) => {
  if (ctx.scene?.current) {
    await ctx.scene.leave();
  }
  await ctx.reply("", getStartInlineKeyboard());
});

cancelMiddleware.action("CANCEL", async (ctx) => {
  await ctx.answerCbQuery();
  if (ctx.scene?.current) {
    await ctx.scene.leave();
  }
  
  // Обновляем клавиатуру в существующем сообщении
  if (ctx.callbackQuery?.message && "message_id" in ctx.callbackQuery.message) {
    try {
      await ctx.editMessageReplyMarkup(getStartInlineKeyboard().reply_markup);
    } catch (error) {
      // Если не удалось отредактировать, отправляем новое сообщение
      await ctx.reply("✅", getStartInlineKeyboard());
    }
  } else {
    await ctx.reply("✅", getStartInlineKeyboard());
  }
});