import { Scenes } from "telegraf";

export function registerFeedbackActions(bot: any) {
  bot.action("FEEDBACK", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("feedback");
  });
}
