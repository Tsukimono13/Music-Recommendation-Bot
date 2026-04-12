import { Telegraf } from "telegraf";
import path from "path";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";
import type { BotContext } from "../context/context";

export function registerSupportActions(bot: Telegraf<BotContext>) {
  bot.action("SUPPORT", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("support");
  });

  bot.action("DONATION_ALERTS", async (ctx) => {
    await ctx.answerCbQuery();
    
    await ctx.reply("🔍 Формирую ссылки...");
    await ctx.reply("https://dalink.to/musigem_bot", {
      ...getStartInlineKeyboard(),
      link_preview_options: { is_disabled: true },
    });
  });

  bot.action("QRCODE", async (ctx) => {
    await ctx.answerCbQuery();
    
    const qrPath = path.resolve("assets/qr.png");
    await ctx.replyWithPhoto({ source: qrPath }, getStartInlineKeyboard());
  });
}
