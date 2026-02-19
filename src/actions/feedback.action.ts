import { Scenes } from "telegraf";

export function registerFeedbackActions(bot: any) {
  bot.action("FEEDBACK", async (ctx: Scenes.SceneContext) => {
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
