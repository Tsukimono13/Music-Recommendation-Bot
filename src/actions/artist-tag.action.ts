import { Scenes } from "telegraf";

export function registerArtistTagActions(bot: any) {
  bot.action("FIND_BY_ARTISTS+TAGS", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("find-by-artist+tags");
  });
}
