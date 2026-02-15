import { Scenes } from "telegraf";

export function registerTagsActions(bot: any) {
  bot.action("FIND_BY_TAGS", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("find-by-tags");
  });
}
