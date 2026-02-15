import { Scenes } from "telegraf";

export function registerArtistActions(bot: any) {
  bot.action("FIND_BY_ARTIST", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("find-by-artist");
  });
}
