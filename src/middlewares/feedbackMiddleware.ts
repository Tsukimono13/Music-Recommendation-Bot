import type { BotContext } from "../context/context";

export const feedbackMiddleware = async (ctx: BotContext, next: () => Promise<void>) => {
  const cbQuery = ctx.callbackQuery;
  const data = cbQuery && "data" in cbQuery ? cbQuery.data?.trim() : undefined;
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
