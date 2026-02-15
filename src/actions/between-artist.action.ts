import { Scenes } from "telegraf";

export function registerBetweenArtistActions(bot: any) {
  bot.action("FIND_BY_ARTIST+ARTIST", async (ctx: Scenes.SceneContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("find-by-artist+artist");
  });
}
