import { Scenes } from "telegraf";
import path from "path";
import { getStartInlineKeyboard } from "../keyboards/start.keyboard";

export function registerSupportActions(bot: any) {
  bot.action("SUPPORT", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("support");
  });

  bot.action("DONATION_ALERTS", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    
    await ctx.reply("🔍 Формирую ссылки...");
    await ctx.reply("https://dalink.to/antonpsybolord", {
      ...getStartInlineKeyboard(),
      link_preview_options: { is_disabled: true },
    });
  });

  bot.action("QRCODE", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    
    const qrPath = path.resolve("assets/qr.png");
    await ctx.replyWithPhoto({ source: qrPath }, getStartInlineKeyboard());
  });
}
