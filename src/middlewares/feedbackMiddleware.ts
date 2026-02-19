import type { BotContext } from "../context/context";

export const feedbackMiddleware = async (ctx: BotContext, next: () => Promise<void>) => {
  const data = ctx.callbackQuery?.data?.trim();
  if (data !== "FEEDBACK") return next();

  try {
    await ctx.answerCbQuery();
    await ctx.scene.enter("feedback");
  } catch (e) {
    console.error("FEEDBACK error:", e);
    try {
      await ctx.answerCbQuery().catch(() => {});
    } catch {
      /* noop */
    }
  }
};
