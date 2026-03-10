import { getStartInlineKeyboard } from "../keyboards/start.keyboard";

const KNOWN_CALLBACKS = new Set([
  "FIND_ARTIST",
  "FIND_DEEP",
  "SUPPORT",
  "DONATION_ALERTS",
  "QRCODE",
  "ABOUT",
  "FAQ",
  "FEEDBACK",
  "CANCEL",
]);

export async function handleLegacyKeyboard(
  ctx: any,
  next: () => Promise<void>,
) {
  if (ctx.callbackQuery?.data && !KNOWN_CALLBACKS.has(ctx.callbackQuery.data)) {
    await ctx.answerCbQuery();
    await ctx.reply(
      "⚠️ Я обновился! Теперь у меня новое меню.",
      getStartInlineKeyboard(),
    );
    return;
  }
  return next();
}
